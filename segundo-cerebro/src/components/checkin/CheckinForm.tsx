"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MOOD_SCALE, ALL_EMOTIONS, MOOD_FACTORS, moodColorForScore } from "@/lib/moods";
import { cn } from "@/lib/utils";

export function CheckinForm() {
  const router = useRouter();
  const supabase = createClient();
  const [score, setScore] = useState<number | null>(null);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [factors, setFactors] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function submit() {
    if (!score) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("mood_checkins").insert({
      user_id: user.id,
      mood_label: MOOD_SCALE.find((m) => m.score === score)?.label ?? "",
      mood_score: score,
      emotions,
      factors,
      notes: notes.trim() || null,
    });

    router.replace("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--fg-muted)]">Sua energia geral</h2>
        <div className="flex justify-between gap-2">
          {MOOD_SCALE.map((m) => (
            <button
              key={m.score}
              onClick={() => setScore(m.score)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1.5 rounded-[var(--radius-md)] border py-3 text-2xl transition-transform",
                score === m.score
                  ? "scale-105 border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border)]"
              )}
              style={score === m.score ? { borderColor: moodColorForScore(m.score) } : undefined}
            >
              <span>{m.emoji}</span>
              <span className="text-[10px] font-normal text-[var(--fg-muted)]">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--fg-muted)]">
          O que você está sentindo, especificamente?
        </h2>
        <div className="flex flex-wrap gap-2">
          {ALL_EMOTIONS.map(({ emotion, color }) => {
            const active = emotions.includes(emotion);
            return (
              <button
                key={emotion}
                onClick={() => toggle(emotions, setEmotions, emotion)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  active ? "text-[var(--bg)]" : "border-[var(--border)] text-[var(--fg-muted)]"
                )}
                style={active ? { backgroundColor: color, borderColor: color } : undefined}
              >
                {emotion}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--fg-muted)]">O que está influenciando isso?</h2>
        <div className="flex flex-wrap gap-2">
          {MOOD_FACTORS.map((f) => {
            const active = factors.includes(f);
            return (
              <button
                key={f}
                onClick={() => toggle(factors, setFactors, f)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  active
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--fg)]"
                    : "border-[var(--border)] text-[var(--fg-muted)]"
                )}
              >
                {f}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--fg-muted)]">Quer registrar algo a mais?</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Opcional…"
          className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
        />
      </section>

      <button disabled={!score || saving} onClick={submit} className="btn-primary w-full py-3 text-sm">
        {saving ? "Salvando…" : "Registrar"}
      </button>
    </div>
  );
}
