"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, cn } from "@/lib/utils";
import { Plus, Trash2, MapPin, Bell } from "lucide-react";

type AgendaEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  reminder_minutes_before: number | null;
};

const REMINDER_OPTIONS = [
  { value: "", label: "Sem lembrete" },
  { value: "15", label: "15 min antes" },
  { value: "30", label: "30 min antes" },
  { value: "60", label: "1 hora antes" },
  { value: "1440", label: "1 dia antes" },
];

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AgendaManager({ initialEvents }: { initialEvents: AgendaEvent[] }) {
  const supabase = createClient();
  const [events, setEvents] = useState(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState(toLocalInputValue(new Date().toISOString()));
  const [endAt, setEndAt] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [reminder, setReminder] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const ev of events) {
      const key = new Date(ev.start_at).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return Array.from(map.entries());
  }, [events]);

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startAt) return;
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("agenda_events")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        start_at: new Date(startAt).toISOString(),
        end_at: endAt ? new Date(endAt).toISOString() : null,
        all_day: allDay,
        reminder_minutes_before: reminder ? Number(reminder) : null,
      })
      .select()
      .single();

    if (data) {
      setEvents([...events, data].sort((a, b) => a.start_at.localeCompare(b.start_at)));
    }
    setSaving(false);
    setShowForm(false);
    setTitle("");
    setDescription("");
    setLocation("");
    setEndAt("");
    setAllDay(false);
    setReminder("");
  }

  async function removeEvent(id: string) {
    setEvents(events.filter((e) => e.id !== id));
    await supabase.from("agenda_events").delete().eq("id", id);
  }

  return (
    <div className="space-y-4">
      {grouped.length === 0 && !showForm && (
        <div className="card p-6 text-center text-sm text-[var(--fg-muted)]">
          Nenhum compromisso à frente. Adicione o primeiro.
        </div>
      )}

      {grouped.map(([dateLabel, items]) => (
        <div key={dateLabel}>
          <h3 className="mb-2 text-xs font-semibold capitalize text-[var(--fg-muted)]">{dateLabel}</h3>
          <div className="space-y-2">
            {items.map((ev) => (
              <div key={ev.id} className="card flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{ev.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                    {ev.all_day ? "Dia inteiro" : formatDateTime(ev.start_at)}
                    {ev.end_at && !ev.all_day ? ` – ${formatDateTime(ev.end_at)}` : ""}
                  </p>
                  {ev.location && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-[var(--fg-muted)]">
                      <MapPin size={12} /> {ev.location}
                    </p>
                  )}
                  {ev.reminder_minutes_before != null && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-[var(--accent)]">
                      <Bell size={12} /> lembrete {ev.reminder_minutes_before} min antes
                    </p>
                  )}
                  {ev.description && <p className="mt-1.5 text-xs text-[var(--fg-muted)]">{ev.description}</p>}
                </div>
                <button onClick={() => removeEvent(ev.id)} className="shrink-0 text-[var(--fg-muted)]">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={addEvent} className="card space-y-3 p-4">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do compromisso"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />

          <label className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            Dia inteiro
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] text-[var(--fg-muted)]">Início</label>
              <input
                type={allDay ? "date" : "datetime-local"}
                value={allDay ? startAt.slice(0, 10) : startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-2 text-xs outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-[var(--fg-muted)]">Fim (opcional)</label>
              <input
                type={allDay ? "date" : "datetime-local"}
                value={allDay ? endAt.slice(0, 10) : endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-2 text-xs outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Local (opcional)"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notas (opcional)"
            rows={2}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />

          <select
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          >
            {REMINDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1 py-2 text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-2 text-sm">
              {saving ? "Salvando…" : "Adicionar"}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className={cn("card flex w-full items-center justify-center gap-2 p-4 text-sm text-[var(--accent)]")}
        >
          <Plus size={16} /> Novo compromisso
        </button>
      )}
    </div>
  );
}
