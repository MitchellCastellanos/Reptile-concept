/**
 * Calendar-day helpers for the Performance dashboard.
 *
 * All "days" are America/Toronto calendar days, represented as `YYYY-MM-DD`
 * strings. Day arithmetic is done on those strings (via UTC noon, which is
 * immune to DST), and only the range boundaries are converted into real UTC
 * instants, so a 23h or 25h daylight-saving day is still exactly one day.
 */
export const ANALYTICS_TZ = "America/Toronto";
export const MAX_RANGE_DAYS = 366;

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDay(day: string): { y: number; m: number; d: number } | null {
  const match = DAY_RE.exec(day);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) {
    return null;
  }
  return { y, m, d };
}

function dayToUtcNoon(day: string): number {
  const p = parseDay(day);
  if (!p) throw new Error(`Invalid day: ${day}`);
  return Date.UTC(p.y, p.m - 1, p.d, 12);
}

export function addDays(day: string, n: number): string {
  return new Date(dayToUtcNoon(day) + n * 86_400_000).toISOString().slice(0, 10);
}

/** Inclusive number of calendar days between two day strings. */
export function diffDaysInclusive(from: string, to: string): number {
  return Math.round((dayToUtcNoon(to) - dayToUtcNoon(from)) / 86_400_000) + 1;
}

export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  for (let n = diffDaysInclusive(from, to), i = 0; i < n; i++) out.push(addDays(from, i));
  return out;
}

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ANALYTICS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function zonedParts(instant: number) {
  const parts: Record<string, number> = {};
  for (const p of partsFormatter.formatToParts(new Date(instant))) {
    if (p.type !== "literal") parts[p.type] = Number(p.value);
  }
  return parts;
}

/** Offset (ms) of America/Toronto from UTC at the given instant. */
function tzOffsetMs(instant: number): number {
  const p = zonedParts(instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** The Toronto calendar day containing `instant`. */
export function torontoDay(instant: Date | number = Date.now()): string {
  const p = zonedParts(typeof instant === "number" ? instant : instant.getTime());
  return `${String(p.year).padStart(4, "0")}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** UTC instant of 00:00 Toronto time on `day`. */
export function torontoDayStart(day: string): Date {
  const p = parseDay(day);
  if (!p) throw new Error(`Invalid day: ${day}`);
  const wallAsUtc = Date.UTC(p.y, p.m - 1, p.d);
  let instant = wallAsUtc - tzOffsetMs(wallAsUtc);
  // Re-check around DST changes: the offset at the guess may differ.
  const corrected = wallAsUtc - tzOffsetMs(instant);
  if (corrected !== instant) instant = corrected;
  return new Date(instant);
}

export type Preset = "7" | "30" | "90" | "custom";
export type LocaleFilter = "all" | "fr" | "en";

export type DateRange = {
  preset: Preset;
  from: string; // inclusive Toronto day
  to: string; // inclusive Toronto day
  days: number;
  prevFrom: string;
  prevTo: string;
  /** Instants: [start, end) for the range, and [prevStart, start) before it. */
  start: Date;
  end: Date;
  prevStart: Date;
};

export type RangeResult = { range: DateRange; error: string | null };

export type RawRangeParams = { range?: string; from?: string; to?: string };

export function buildRange(preset: Preset, from: string, to: string): DateRange {
  const days = diffDaysInclusive(from, to);
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(days - 1));
  return {
    preset,
    from,
    to,
    days,
    prevFrom,
    prevTo,
    start: torontoDayStart(from),
    end: torontoDayStart(addDays(to, 1)),
    prevStart: torontoDayStart(prevFrom),
  };
}

/**
 * Resolve URL search params into a validated range. Never throws: invalid
 * input falls back to the default (last 30 days) and reports an error message
 * (French, shown in the admin UI).
 */
export function resolveRange(params: RawRangeParams, now: Date | number = Date.now()): RangeResult {
  const today = torontoDay(now);
  const preset = (n: number): DateRange =>
    buildRange(String(n) as Preset, addDays(today, -(n - 1)), today);
  const fallback = () => preset(30);

  if (params.from !== undefined || params.to !== undefined || params.range === "custom") {
    const from = params.from ?? "";
    const to = params.to ?? "";
    if (!parseDay(from) || !parseDay(to)) {
      return { range: fallback(), error: "Dates invalides — période par défaut affichée." };
    }
    if (from > to) {
      return { range: fallback(), error: "La date de début doit précéder la date de fin." };
    }
    if (to > today) {
      return { range: fallback(), error: "La date de fin ne peut pas être dans le futur." };
    }
    if (diffDaysInclusive(from, to) > MAX_RANGE_DAYS) {
      return {
        range: fallback(),
        error: `La période ne peut pas dépasser ${MAX_RANGE_DAYS} jours.`,
      };
    }
    return { range: buildRange("custom", from, to), error: null };
  }

  if (params.range === "7") return { range: preset(7), error: null };
  if (params.range === "90") return { range: preset(90), error: null };
  if (params.range === undefined || params.range === "30") return { range: preset(30), error: null };
  return { range: fallback(), error: "Période inconnue — 30 derniers jours affichés." };
}

export function parseLocaleFilter(value: string | undefined): LocaleFilter {
  return value === "fr" || value === "en" ? value : "all";
}

/** Percent change, or null when the previous value is zero (undefined). */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
