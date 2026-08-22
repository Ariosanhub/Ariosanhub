import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { formatDateTime } from "@/lib/utils";
import { COGNITIVE_DISTORTIONS } from "@/lib/cbt/distortions";
import { DeleteEntryButton } from "@/components/journal/DeleteEntryButton";

export default async function JournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: entry } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!entry) notFound();

  const distortionLabels = (entry.cognitive_distortions ?? [])
    .map((k: string) => COGNITIVE_DISTORTIONS.find((d) => d.key === k)?.label)
    .filter(Boolean);

  return (
    <>
      <PageHeader
        title={entry.entry_type === "thought_record" ? "Registro de pensamento" : "Escrita livre"}
        subtitle={formatDateTime(entry.created_at)}
        backHref="/journal"
      />

      <div className="space-y-5">
        {entry.entry_type === "thought_record" ? (
          <>
            <Block label="Situação" value={entry.situation} />
            <Block label="Pensamento automático" value={entry.automatic_thought} />
            {entry.emotion && (
              <Block label="Emoção" value={`${entry.emotion} · intensidade ${entry.emotion_intensity ?? "—"}/10`} />
            )}
            {distortionLabels.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-[var(--fg-muted)]">Distorções identificadas</p>
                <div className="flex flex-wrap gap-2">
                  {distortionLabels.map((l: string) => (
                    <span key={l} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--fg-muted)]">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <Block label="Evidências a favor" value={entry.evidence_for} />
            <Block label="Evidências contra" value={entry.evidence_against} />
            <Block label="Pensamento equilibrado" value={entry.balanced_thought} accent />
            <Block label="Plano de ação" value={entry.action_plan} />
          </>
        ) : (
          <Block label="Registro" value={entry.free_text} />
        )}

        <DeleteEntryButton id={entry.id} />
      </div>
    </>
  );
}

function Block({ label, value, accent }: { label: string; value: string | null; accent?: boolean }) {
  if (!value) return null;
  return (
    <div className={accent ? "card p-4" : undefined}>
      <p className="mb-1.5 text-xs font-medium text-[var(--fg-muted)]">{label}</p>
      <p className={`whitespace-pre-wrap text-sm ${accent ? "text-[var(--accent)]" : ""}`}>{value}</p>
    </div>
  );
}
