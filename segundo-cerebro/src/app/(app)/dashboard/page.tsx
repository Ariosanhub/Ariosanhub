import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { COGNITIVE_DISTORTIONS } from "@/lib/cbt/distortions";
import { daysAgoISO } from "@/lib/utils";
import { MoodTrendChart } from "@/components/dashboard/MoodTrendChart";
import { DistortionsChart } from "@/components/dashboard/DistortionsChart";
import { StatTile } from "@/components/dashboard/StatTile";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sixtyDaysAgo = daysAgoISO(60);

  const [
    { data: moodCheckins },
    { data: journalEntries, count: journalCount },
    { count: chatCount },
    { data: lessonProgress },
    { count: totalLessons },
    { data: habits },
  ] = await Promise.all([
    supabase
      .from("mood_checkins")
      .select("mood_score, created_at")
      .eq("user_id", user.id)
      .gte("created_at", sixtyDaysAgo)
      .order("created_at", { ascending: true }),
    supabase
      .from("journal_entries")
      .select("cognitive_distortions", { count: "exact" })
      .eq("user_id", user.id)
      .eq("entry_type", "thought_record"),
    supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("lesson_progress").select("lesson_id").eq("user_id", user.id).not("completed_at", "is", null),
    supabase.from("lessons").select("id", { count: "exact", head: true }),
    supabase.from("habits").select("id").eq("user_id", user.id).eq("archived", false),
  ]);

  const distortionCounts = new Map<string, number>();
  for (const entry of journalEntries ?? []) {
    for (const key of entry.cognitive_distortions ?? []) {
      distortionCounts.set(key, (distortionCounts.get(key) ?? 0) + 1);
    }
  }
  const distortionData = Array.from(distortionCounts.entries())
    .map(([key, count]) => ({
      label: COGNITIVE_DISTORTIONS.find((d) => d.key === key)?.label ?? key,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Painel</h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">Sua evolução, com dados e histórico.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Registros no diário" value={journalCount ?? 0} />
        <StatTile label="Conversas com a Nina" value={chatCount ?? 0} />
        <StatTile label="Lições concluídas" value={`${lessonProgress?.length ?? 0}/${totalLessons ?? 0}`} />
        <StatTile label="Hábitos ativos" value={habits?.length ?? 0} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--fg-muted)]">Humor nos últimos 60 dias</h2>
        <div className="card p-4">
          <MoodTrendChart data={moodCheckins ?? []} />
        </div>
      </section>

      {distortionData.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[var(--fg-muted)]">
            Distorções cognitivas mais frequentes
          </h2>
          <div className="card p-4">
            <DistortionsChart data={distortionData} />
          </div>
          <p className="mt-2 text-xs text-[var(--fg-muted)]">
            Identificar o padrão que mais se repete é o primeiro passo para desarmá-lo.
          </p>
        </section>
      )}
    </div>
  );
}
