"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { todayISO, cn } from "@/lib/utils";
import { Check, Plus, Archive } from "lucide-react";

type Habit = { id: string; name: string; icon: string | null; archived: boolean; created_at: string };
type Log = { habit_id: string; log_date: string; done: boolean };

const ICON_SUGGESTIONS = ["😴", "🏃", "🧘", "📚", "🎯", "💧", "🥗", "✍️"];

export function HabitsManager({
  initialHabits,
  initialLogs,
}: {
  initialHabits: Habit[];
  initialLogs: Log[];
}) {
  const supabase = createClient();
  const [habits, setHabits] = useState(initialHabits.filter((h) => !h.archived));
  const [logs, setLogs] = useState(initialLogs);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICON_SUGGESTIONS[0]);
  const [showAdd, setShowAdd] = useState(false);
  const today = todayISO();

  const logsByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const l of logs) {
      if (!l.done) continue;
      if (!map.has(l.habit_id)) map.set(l.habit_id, new Set());
      map.get(l.habit_id)!.add(l.log_date);
    }
    return map;
  }, [logs]);

  function streakFor(habitId: string) {
    const days = logsByHabit.get(habitId);
    if (!days) return 0;
    let streak = 0;
    const cursor = new Date();
    if (!days.has(today)) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  async function addHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("habits")
      .insert({ user_id: user.id, name: name.trim(), icon })
      .select()
      .single();

    if (data) setHabits([...habits, data]);
    setName("");
    setShowAdd(false);
  }

  async function archiveHabit(id: string) {
    setHabits(habits.filter((h) => h.id !== id));
    await supabase.from("habits").update({ archived: true }).eq("id", id);
  }

  async function toggleToday(habitId: string) {
    const isDone = logsByHabit.get(habitId)?.has(today) ?? false;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (isDone) {
      setLogs(logs.filter((l) => !(l.habit_id === habitId && l.log_date === today)));
      await supabase.from("habit_logs").delete().eq("user_id", user.id).eq("habit_id", habitId).eq("log_date", today);
    } else {
      setLogs([...logs, { habit_id: habitId, log_date: today, done: true }]);
      await supabase
        .from("habit_logs")
        .upsert({ user_id: user.id, habit_id: habitId, log_date: today, done: true }, { onConflict: "habit_id,log_date" });
    }
  }

  return (
    <div className="space-y-3">
      {habits.map((h) => {
        const checked = logsByHabit.get(h.id)?.has(today) ?? false;
        const streak = streakFor(h.id);
        return (
          <div key={h.id} className="card flex items-center gap-3 p-4">
            <button
              onClick={() => toggleToday(h.id)}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                checked ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border)]"
              )}
            >
              {checked && <Check size={16} strokeWidth={3} className="text-[var(--bg)]" />}
            </button>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {h.icon ? `${h.icon} ` : ""}
                {h.name}
              </p>
              {streak > 0 && (
                <p className="text-xs text-[var(--accent)]">🔥 {streak} {streak === 1 ? "dia" : "dias"} seguidos</p>
              )}
            </div>
            <button onClick={() => archiveHabit(h.id)} className="text-[var(--fg-muted)]">
              <Archive size={16} />
            </button>
          </div>
        );
      })}

      {showAdd ? (
        <form onSubmit={addHabit} className="card space-y-3 p-4">
          <div className="flex gap-2">
            {ICON_SUGGESTIONS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border text-base",
                  icon === i ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border)]"
                )}
              >
                {i}
              </button>
            ))}
          </div>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do hábito (ex: Dormir 7h)"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost flex-1 py-2 text-sm">
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 py-2 text-sm">
              Adicionar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="card flex w-full items-center justify-center gap-2 p-4 text-sm text-[var(--accent)]"
        >
          <Plus size={16} /> Novo hábito
        </button>
      )}
    </div>
  );
}
