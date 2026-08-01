// Structured per-day store hours (admin-editable via dropdowns, day by day),
// used to derive the bilingual summary text shown in the footer, receipts,
// and transactional emails (StoreSettings.hoursFr / hoursEn).
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DaySchedule = {
  closed: boolean;
  start: string; // "HH:mm", 24h
  end: string; // "HH:mm", 24h
};

export type WeeklyHours = Record<DayKey, DaySchedule>;

export const DAY_ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DAY_LABELS: Record<DayKey, { fr: string; en: string; frShort: string; enShort: string }> = {
  mon: { fr: "Lundi", en: "Monday", frShort: "Lun", enShort: "Mon" },
  tue: { fr: "Mardi", en: "Tuesday", frShort: "Mar", enShort: "Tue" },
  wed: { fr: "Mercredi", en: "Wednesday", frShort: "Mer", enShort: "Wed" },
  thu: { fr: "Jeudi", en: "Thursday", frShort: "Jeu", enShort: "Thu" },
  fri: { fr: "Vendredi", en: "Friday", frShort: "Ven", enShort: "Fri" },
  sat: { fr: "Samedi", en: "Saturday", frShort: "Sam", enShort: "Sat" },
  sun: { fr: "Dimanche", en: "Sunday", frShort: "Dim", enShort: "Sun" },
};

// Every 30 minutes, "00:00" through "23:30".
export const TIME_OPTIONS: { value: string; label: string }[] = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? "00" : "30";
  const value = `${String(hours).padStart(2, "0")}:${minutes}`;
  return { value, label: `${hours}h${minutes}` };
});

const TIME_VALUES = new Set(TIME_OPTIONS.map((o) => o.value));

const DEFAULT_OPEN: DaySchedule = { closed: false, start: "10:00", end: "18:00" };
const DEFAULT_CLOSED: DaySchedule = { closed: true, start: "10:00", end: "18:00" };

export const DEFAULT_WEEKLY_HOURS: WeeklyHours = {
  mon: DEFAULT_OPEN,
  tue: DEFAULT_OPEN,
  wed: DEFAULT_OPEN,
  thu: DEFAULT_OPEN,
  fri: DEFAULT_OPEN,
  sat: DEFAULT_OPEN,
  sun: DEFAULT_CLOSED,
};

export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && TIME_VALUES.has(value);
}

// Tolerant of missing/malformed data (e.g. before this feature existed, or a
// hand-edited DB row) — falls back to the default per day rather than
// rejecting the whole schedule.
export function parseWeeklyHours(value: unknown): WeeklyHours {
  if (!value || typeof value !== "object") return DEFAULT_WEEKLY_HOURS;
  const raw = value as Record<string, unknown>;
  const result = {} as WeeklyHours;
  for (const day of DAY_ORDER) {
    const entry = raw[day];
    if (entry && typeof entry === "object") {
      const e = entry as Record<string, unknown>;
      const start = isValidTime(e.start) ? e.start : DEFAULT_WEEKLY_HOURS[day].start;
      const end = isValidTime(e.end) ? e.end : DEFAULT_WEEKLY_HOURS[day].end;
      result[day] = { closed: Boolean(e.closed), start, end };
    } else {
      result[day] = DEFAULT_WEEKLY_HOURS[day];
    }
  }
  return result;
}

function sameSchedule(a: DaySchedule, b: DaySchedule): boolean {
  if (a.closed && b.closed) return true;
  return a.closed === b.closed && a.start === b.start && a.end === b.end;
}

function formatTimeFr(time: string): string {
  const [h, m] = time.split(":");
  const hour = Number(h);
  return m === "00" ? `${hour}h` : `${hour}h${m}`;
}

function formatTimeEn(time: string): string {
  const [h, m] = time.split(":");
  const hour = Number(h);
  const period = hour < 12 ? "am" : "pm";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return m === "00" ? `${hour12}${period}` : `${hour12}:${m}${period}`;
}

// Groups consecutive days (Mon..Sun) that share the same schedule so the
// summary reads "Lun–Sam 10h–18h, Dim fermé" instead of one line per day.
export function formatWeeklyHours(weeklyHours: WeeklyHours, locale: "fr" | "en"): string {
  const groups: { days: DayKey[]; schedule: DaySchedule }[] = [];
  for (const day of DAY_ORDER) {
    const schedule = weeklyHours[day];
    const last = groups[groups.length - 1];
    if (last && sameSchedule(last.schedule, schedule)) {
      last.days.push(day);
    } else {
      groups.push({ days: [day], schedule });
    }
  }

  const dayLabel = (day: DayKey) => (locale === "fr" ? DAY_LABELS[day].frShort : DAY_LABELS[day].enShort);
  const formatTime = locale === "fr" ? formatTimeFr : formatTimeEn;

  return groups
    .map(({ days, schedule }) => {
      const dayPart = days.length > 1 ? `${dayLabel(days[0])}–${dayLabel(days[days.length - 1])}` : dayLabel(days[0]);
      const timePart = schedule.closed
        ? locale === "fr"
          ? "fermé"
          : "closed"
        : `${formatTime(schedule.start)}–${formatTime(schedule.end)}`;
      return `${dayPart} ${timePart}`;
    })
    .join(", ");
}
