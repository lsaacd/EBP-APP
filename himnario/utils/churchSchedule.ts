/**
 * Turns a church's free-text service times into rows for display.
 *
 * Service times are stored as one string, e.g.
 *   "Martes 7:00 PM–9:00 PM · Viernes 7:00 PM–9:00 PM (Estudio bíblico de jóvenes)"
 * Each "·"-separated segment must be `<day> <time>[–<time>] [(note)]`. If any
 * segment does not fit, the whole text is rejected (null) so the caller can
 * fall back to showing it verbatim rather than a half-parsed schedule.
 */

export type ScheduleRow = {
  /** Day label exactly as written in the source text. */
  day: string;
  /** 0 = Sunday … 6 = Saturday (matches `Date.getDay()`). */
  dayIndex: number;
  /** Compact time label, e.g. "7:00 – 9:00 PM". */
  time: string;
  note: string | null;
  /** Start and end as minutes after midnight (end is null for a single time). */
  start: number;
  end: number | null;
};

const DAY_INDEX: Record<string, number> = {
  domingo: 0, domingos: 0, sunday: 0, sundays: 0,
  lunes: 1, monday: 1, mondays: 1,
  martes: 2, tuesday: 2, tuesdays: 2,
  miercoles: 3, wednesday: 3, wednesdays: 3,
  jueves: 4, thursday: 4, thursdays: 4,
  viernes: 5, friday: 5, fridays: 5,
  sabado: 6, sabados: 6, saturday: 6, saturdays: 6,
};

const fold = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const TIME = String.raw`(\d{1,2})(?::(\d{2}))?\s*([AaPp])\.?\s*[Mm]\.?`;
const SEGMENT = new RegExp(
  String.raw`^(\S+)\s+${TIME}(?:\s*[–—-]\s*${TIME})?\s*(?:\((.+)\))?$`,
);

const clock = (hour: string, minute: string | undefined) => `${Number(hour)}:${minute ?? '00'}`;
const toMinutes = (hour: string, minute: string | undefined, letter: string) =>
  ((Number(hour) % 12) + (letter.toLowerCase() === 'p' ? 12 : 0)) * 60 + Number(minute ?? '0');
const meridiem = (letter: string) => (letter.toLowerCase() === 'a' ? 'AM' : 'PM');

export function parseServiceTimes(text: string | null | undefined): ScheduleRow[] | null {
  if (!text) return null;
  const segments = text
    .split(/\s*[·•;\n|]\s*/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (segments.length === 0) return null;

  const rows: ScheduleRow[] = [];
  for (const segment of segments) {
    const match = SEGMENT.exec(segment);
    if (!match) return null;
    const [, day, h1, m1, p1, h2, m2, p2, note] = match;
    const dayIndex = DAY_INDEX[fold(day.replace(/[:,]$/, ''))];
    if (dayIndex === undefined) return null;

    let time = `${clock(h1, m1)} ${meridiem(p1)}`;
    if (h2 && p2) {
      time =
        meridiem(p1) === meridiem(p2)
          ? `${clock(h1, m1)} – ${clock(h2, m2)} ${meridiem(p2)}`
          : `${clock(h1, m1)} ${meridiem(p1)} – ${clock(h2, m2)} ${meridiem(p2)}`;
    }
    rows.push({
      day: day.replace(/[:,]$/, ''),
      dayIndex,
      time,
      note: note ? note.trim() : null,
      start: toMinutes(h1, m1, p1),
      end: h2 && p2 ? toMinutes(h2, m2, p2) : null,
    });
  }
  return rows;
}

// ── Building the text back from a structured editor ────────────────────────

export type ScheduleEntry = {
  dayIndex: number;
  start: number;
  end: number | null;
  note: string;
};

/** Stored day names are Spanish: the directory's congregations are Spanish-speaking. */
const DAY_NAMES_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function formatClock(minutes: number): string {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hour24 = Math.floor(total / 60);
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(total % 60).padStart(2, '0')} ${hour24 < 12 ? 'AM' : 'PM'}`;
}

/** Monday-first, then by start time — the order a weekly schedule is read in. */
export function sortScheduleEntries<T extends { dayIndex: number; start: number }>(entries: T[]): T[] {
  return [...entries].sort(
    (a, b) => ((a.dayIndex + 6) % 7) - ((b.dayIndex + 6) % 7) || a.start - b.start,
  );
}

/** Produces text that `parseServiceTimes` reads back into the same entries. */
export function serializeSchedule(entries: ScheduleEntry[]): string {
  return sortScheduleEntries(entries)
    .map((entry) => {
      const note = entry.note.replace(/[()·•;|\n]/g, ' ').replace(/\s+/g, ' ').trim();
      const range =
        entry.end === null
          ? formatClock(entry.start)
          : `${formatClock(entry.start)}–${formatClock(entry.end)}`;
      return `${DAY_NAMES_ES[entry.dayIndex]} ${range}${note ? ` (${note})` : ''}`;
    })
    .join(' · ');
}
