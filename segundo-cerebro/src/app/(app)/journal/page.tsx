import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function JournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id, entry_type, situation, emotion, emotion_intensity, free_text, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Diário</h1>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">Seus registros, com data e histórico completo.</p>
        </div>
        <Link
          href="/journal/new"
          className="btn-primary flex h-10 w-10 items-center justify-center rounded-full"
        >
          <Plus size={18} />
        </Link>
      </div>

      {(!entries || entries.length === 0) && (
        <div className="card p-6 text-center text-sm text-[var(--fg-muted)]">
          Nenhum registro ainda. Comece pelo seu primeiro pensamento que valha examinar.
        </div>
      )}

      <div className="space-y-3">
        {entries?.map((entry) => (
          <Link key={entry.id} href={`/journal/${entry.id}`} className="card block p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--fg-muted)]">
                {entry.entry_type === "thought_record" ? "Registro de pensamento" : "Escrita livre"}
              </span>
              <span className="text-[11px] text-[var(--fg-muted)]">{formatDateTime(entry.created_at)}</span>
            </div>
            <p className="line-clamp-2 text-sm">
              {entry.situation || entry.free_text || "Ver registro"}
            </p>
            {entry.emotion && (
              <p className="mt-1 text-xs text-[var(--fg-muted)]">
                {entry.emotion}
                {entry.emotion_intensity != null ? ` · intensidade ${entry.emotion_intensity}/10` : ""}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
