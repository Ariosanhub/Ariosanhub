type IcsEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
};

function escapeIcsText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function toIcsDateTime(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function toIcsDate(iso: string) {
  return iso.slice(0, 10).replace(/-/g, "");
}

export function buildIcsFeed(events: IcsEvent[], calendarName: string) {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ancora//Agenda Pessoal//PT",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
  ];

  for (const ev of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${ev.id}@ancora`);
    lines.push(`DTSTAMP:${toIcsDateTime(new Date().toISOString())}`);
    if (ev.all_day) {
      lines.push(`DTSTART;VALUE=DATE:${toIcsDate(ev.start_at)}`);
      if (ev.end_at) lines.push(`DTEND;VALUE=DATE:${toIcsDate(ev.end_at)}`);
    } else {
      lines.push(`DTSTART:${toIcsDateTime(ev.start_at)}`);
      if (ev.end_at) lines.push(`DTEND:${toIcsDateTime(ev.end_at)}`);
    }
    lines.push(`SUMMARY:${escapeIcsText(ev.title)}`);
    if (ev.description) lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
    if (ev.location) lines.push(`LOCATION:${escapeIcsText(ev.location)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
