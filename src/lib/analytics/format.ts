/** "Nice" y-axis scale: returns ticks from 0 to a rounded max (always >= 1 step). */
export function niceScale(max: number, targetTicks = 4): { max: number; ticks: number[] } {
  const safe = Math.max(1, Math.ceil(max));
  const rough = safe / targetTicks;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / pow;
  const step = Math.max(1, (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * pow);
  const top = Math.ceil(safe / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  return { max: top, ticks };
}

const longFmt = new Intl.DateTimeFormat("fr-CA", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const shortFmt = new Intl.DateTimeFormat("fr-CA", { timeZone: "UTC", day: "numeric", month: "short" });

// Day strings are Toronto calendar days, so they are formatted as UTC noon to
// avoid any timezone shift.
export const formatDayLong = (day: string) => longFmt.format(new Date(`${day}T12:00:00Z`));
export const formatDayShort = (day: string) => shortFmt.format(new Date(`${day}T12:00:00Z`));

const numberFmt = new Intl.NumberFormat("fr-CA");
export const formatNumber = (n: number) => numberFmt.format(n);
export const formatDecimal = (n: number) =>
  new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 1 }).format(n);
