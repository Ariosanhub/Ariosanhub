import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Check } from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";

export default async function LessonsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: lessons }, { data: progress }] = await Promise.all([
    supabase.from("lessons").select("id, slug, title, category, summary, order_index").order("order_index"),
    supabase.from("lesson_progress").select("lesson_id").eq("user_id", user.id).not("completed_at", "is", null),
  ]);

  const completedIds = new Set((progress ?? []).map((p) => p.lesson_id));
  const total = lessons?.length ?? 0;
  const done = completedIds.size;

  const grouped = (lessons ?? []).reduce<Record<string, typeof lessons>>((acc, l) => {
    (acc[l.category] ??= []).push(l);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight">Lições</h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">TCC e neurociência aplicadas ao seu dia a dia.</p>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={done} max={total || 1} />
          <span className="shrink-0 text-xs text-[var(--fg-muted)]">
            {done}/{total}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
              {category}
            </h2>
            <div className="space-y-2">
              {items!.map((lesson) => {
                const isDone = completedIds.has(lesson.id);
                return (
                  <Link key={lesson.id} href={`/lessons/${lesson.slug}`} className="card flex items-center gap-3 p-4">
                    <span
                      className={
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 " +
                        (isDone ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border)]")
                      }
                    >
                      {isDone && <Check size={14} strokeWidth={3} className="text-[var(--bg)]" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{lesson.title}</p>
                      <p className="line-clamp-1 text-xs text-[var(--fg-muted)]">{lesson.summary}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
