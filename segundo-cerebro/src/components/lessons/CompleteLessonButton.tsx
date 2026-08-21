"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";

export function CompleteLessonButton({
  lessonId,
  initialCompleted,
  initialReflection,
}: {
  lessonId: string;
  initialCompleted: boolean;
  initialReflection: string;
}) {
  const supabase = createClient();
  const [completed, setCompleted] = useState(initialCompleted);
  const [reflection, setReflection] = useState(initialReflection);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("lesson_progress").upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        completed_at: new Date().toISOString(),
        reflection: reflection.trim() || null,
      },
      { onConflict: "user_id,lesson_id" }
    );
    setCompleted(true);
    setSaving(false);
  }

  return (
    <div className="card space-y-3 p-4">
      <label className="block text-xs font-medium text-[var(--fg-muted)]">
        O que fica dessa lição para você? (opcional)
      </label>
      <textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        rows={3}
        className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
        placeholder="Uma frase, uma percepção, um plano…"
      />
      <button
        onClick={save}
        disabled={saving}
        className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 text-sm"
      >
        {completed && <Check size={16} />}
        {completed ? "Concluída — atualizar reflexão" : saving ? "Salvando…" : "Marcar como concluída"}
      </button>
    </div>
  );
}
