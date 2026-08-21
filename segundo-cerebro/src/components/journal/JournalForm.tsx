"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { COGNITIVE_DISTORTIONS } from "@/lib/cbt/distortions";
import { cn } from "@/lib/utils";

const EMOTION_OPTIONS = [
  "Ansiedade",
  "Medo",
  "Raiva",
  "Culpa",
  "Vergonha",
  "Tristeza",
  "Frustração",
  "Insegurança",
];

export function JournalForm() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"thought_record" | "free">("thought_record");
  const [saving, setSaving] = useState(false);

  const [situation, setSituation] = useState("");
  const [automaticThought, setAutomaticThought] = useState("");
  const [emotion, setEmotion] = useState("");
  const [intensity, setIntensity] = useState(5);
  const [distortions, setDistortions] = useState<string[]>([]);
  const [evidenceFor, setEvidenceFor] = useState("");
  const [evidenceAgainst, setEvidenceAgainst] = useState("");
  const [balancedThought, setBalancedThought] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [freeText, setFreeText] = useState("");

  function toggleDistortion(key: string) {
    setDistortions(distortions.includes(key) ? distortions.filter((d) => d !== key) : [...distortions, key]);
  }

  async function submit() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      entry_type: mode,
      situation: mode === "thought_record" ? situation.trim() || null : null,
      automatic_thought: mode === "thought_record" ? automaticThought.trim() || null : null,
      emotion: mode === "thought_record" ? emotion || null : null,
      emotion_intensity: mode === "thought_record" ? intensity : null,
      cognitive_distortions: mode === "thought_record" ? distortions : [],
      evidence_for: mode === "thought_record" ? evidenceFor.trim() || null : null,
      evidence_against: mode === "thought_record" ? evidenceAgainst.trim() || null : null,
      balanced_thought: mode === "thought_record" ? balancedThought.trim() || null : null,
      action_plan: mode === "thought_record" ? actionPlan.trim() || null : null,
      free_text: mode === "free" ? freeText.trim() || null : null,
    };

    await supabase.from("journal_entries").insert(payload);
    router.replace("/journal");
    router.refresh();
  }

  const canSave = mode === "thought_record" ? situation.trim().length > 0 : freeText.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-full border border-[var(--border)] p-1">
        <button
          onClick={() => setMode("thought_record")}
          className={cn(
            "flex-1 rounded-full py-2 text-xs font-medium transition-colors",
            mode === "thought_record" ? "bg-[var(--accent)] text-[var(--bg)]" : "text-[var(--fg-muted)]"
          )}
        >
          Registro guiado (TCC)
        </button>
        <button
          onClick={() => setMode("free")}
          className={cn(
            "flex-1 rounded-full py-2 text-xs font-medium transition-colors",
            mode === "free" ? "bg-[var(--accent)] text-[var(--bg)]" : "text-[var(--fg-muted)]"
          )}
        >
          Escrita livre
        </button>
      </div>

      {mode === "thought_record" ? (
        <div className="space-y-5">
          <Field label="1. Qual foi a situação?">
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              rows={2}
              placeholder="Descreva o fato, sem julgamento…"
              className="input"
            />
          </Field>

          <Field label="2. Qual pensamento automático passou pela sua cabeça?">
            <textarea
              value={automaticThought}
              onChange={(e) => setAutomaticThought(e.target.value)}
              rows={2}
              className="input"
            />
          </Field>

          <Field label="3. Qual emoção isso gerou, e com que intensidade?">
            <div className="mb-2 flex flex-wrap gap-2">
              {EMOTION_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmotion(e)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs",
                    emotion === e ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)] text-[var(--fg-muted)]"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
            <p className="text-xs text-[var(--fg-muted)]">Intensidade: {intensity}/10</p>
          </Field>

          <Field label="Distorções cognitivas presentes (opcional)">
            <div className="flex flex-wrap gap-2">
              {COGNITIVE_DISTORTIONS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => toggleDistortion(d.key)}
                  title={d.description}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs",
                    distortions.includes(d.key)
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border)] text-[var(--fg-muted)]"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="4. Evidências a favor do pensamento">
            <textarea value={evidenceFor} onChange={(e) => setEvidenceFor(e.target.value)} rows={2} className="input" />
          </Field>

          <Field label="Evidências contra o pensamento">
            <textarea
              value={evidenceAgainst}
              onChange={(e) => setEvidenceAgainst(e.target.value)}
              rows={2}
              className="input"
            />
          </Field>

          <Field label="5. Pensamento mais equilibrado">
            <textarea
              value={balancedThought}
              onChange={(e) => setBalancedThought(e.target.value)}
              rows={2}
              className="input"
            />
          </Field>

          <Field label="Plano de ação / limite a comunicar (opcional)">
            <textarea value={actionPlan} onChange={(e) => setActionPlan(e.target.value)} rows={2} className="input" />
          </Field>
        </div>
      ) : (
        <Field label="O que você quer registrar hoje?">
          <textarea
            autoFocus
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={10}
            placeholder="Escreva livremente…"
            className="input"
          />
        </Field>
      )}

      <button disabled={!canSave || saving} onClick={submit} className="btn-primary w-full py-3 text-sm">
        {saving ? "Salvando…" : "Salvar registro"}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--bg-elevated);
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[var(--fg-muted)]">{label}</label>
      {children}
    </div>
  );
}
