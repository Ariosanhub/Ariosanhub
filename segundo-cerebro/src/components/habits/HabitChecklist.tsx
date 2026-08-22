"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Habit = { id: string; name: string; icon: string | null };
type HabitLog = { habit_id: string; done: boolean };

export function HabitChecklist({
  habits,
  logs,
  date,
}: {
  habits: Habit[];
  logs: HabitLog[];
  date: string;
}) {
  const supabase = createClient();
  const [done, setDone] = useState<Set<string>>(
    new Set(logs.filter((l) => l.done).map((l) => l.habit_id))
  );
  const [, startTransition] = useTransition();

  if (habits.length === 0) {
    return (
      <Link href="/habits" className="card block p-4 text-sm text-[var(--fg-muted)]">
        Você ainda não tem hábitos cadastrados. Toque para criar o primeiro.
      </Link>
    );
  }

  function toggle(habitId: string) {
    const isDone = done.has(habitId);
    const next = new Set(done);
    if (isDone) {
      next.delete(habitId);
    } else {
      next.add(habitId);
    }
    setDone(next);

    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (isDone) {
        await supabase
          .from("habit_logs")
          .delete()
          .eq("user_id", user.id)
          .eq("habit_id", habitId)
          .eq("log_date", date);
      } else {
        await supabase
          .from("habit_logs")
          .upsert(
            { user_id: user.id, habit_id: habitId, log_date: date, done: true },
            { onConflict: "habit_id,log_date" }
          );
      }
    });
  }

  return (
    <div className="card divide-y divide-[var(--border)]">
      {habits.map((h) => {
        const checked = done.has(h.id);
        return (
          <button
            key={h.id}
            onClick={() => toggle(h.id)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                checked ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border)]"
              )}
            >
              {checked && <Check size={14} strokeWidth={3} className="text-[var(--bg)]" />}
            </span>
            <span className="text-sm">
              {h.icon ? `${h.icon} ` : ""}
              {h.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
