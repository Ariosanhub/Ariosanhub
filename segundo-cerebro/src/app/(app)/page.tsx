import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/utils";
import { MOOD_SCALE } from "@/lib/moods";
import { HabitChecklist } from "@/components/habits/HabitChecklist";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  const today = todayISO();
  const startOfDay = `${today}T00:00:00.000Z`;

  const [
    { data: todayCheckin },
    { data: habits },
    { data: habitLogs },
    { data: progress },
    { data: lastEntry },
    { data: allLessons },
  ] = await Promise.all([
    supabase
      .from("mood_checkins")
      .select("id, mood_score, created_at")
      .eq("user_id", user.id)
      .gte("created_at", startOfDay)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("habits").select("id, name, icon").eq("user_id", user.id).eq("archived", false).order("created_at"),
    supabase.from("habit_logs").select("habit_id, done").eq("user_id", user.id).eq("log_date", today),
    supabase.from("lesson_progress").select("lesson_id").eq("user_id", user.id).not("completed_at", "is", null),
    supabase
      .from("journal_entries")
      .select("id, created_at, situation")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("lessons").select("id, slug, title, summary").order("order_index"),
  ]);

  const completedLessonIds = new Set((progress ?? []).map((p) => p.lesson_id));
  const nextLesson = (allLessons ?? []).find((l) => !completedLessonIds.has(l.id));
  const lessonsDoneCount = progress?.length ?? 0;
  const totalLessons = allLessons?.length ?? 0;

  const name = profile.display_name || "por aí";
  const moodEntry = todayCheckin
    ? MOOD_SCALE.find((m) => m.score === todayCheckin.mood_score)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-[var(--fg-muted)]">{greeting()},</p>
        <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
      </div>

      <Link
        href="/checkin"
        className="card block p-4 transition-transform active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">
              Check-in de hoje
            </p>
            <p className="mt-1 text-base font-medium">
              {moodEntry ? `${moodEntry.emoji} Você registrou: ${moodEntry.label}` : "Como você está agora?"}
            </p>
          </div>
          <span className="text-2xl">{moodEntry ? "✓" : "→"}</span>
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/journal/new" className="card flex flex-col gap-1.5 p-4">
          <span className="text-lg">📓</span>
          <span className="text-sm font-medium">Novo registro no diário</span>
        </Link>
        <Link href="/chat" className="card flex flex-col gap-1.5 p-4">
          <span className="text-lg">💬</span>
          <span className="text-sm font-medium">Conversar com a Nina</span>
        </Link>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--fg-muted)]">Hábitos de hoje</h2>
          <Link href="/habits" className="text-xs text-[var(--accent)]">
            gerenciar
          </Link>
        </div>
        <HabitChecklist habits={habits ?? []} logs={habitLogs ?? []} date={today} />
      </section>

      {nextLesson && (
        <Link href={`/lessons/${nextLesson.slug}`} className="card block p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">
            Próxima lição · {lessonsDoneCount}/{totalLessons} concluídas
          </p>
          <p className="mt-1 text-base font-medium">{nextLesson.title}</p>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">{nextLesson.summary}</p>
        </Link>
      )}

      {lastEntry && (
        <Link href={`/journal/${lastEntry.id}`} className="card block p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">
            Último registro no diário
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--fg-muted)]">
            {lastEntry.situation || "Ver registro"}
          </p>
        </Link>
      )}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
