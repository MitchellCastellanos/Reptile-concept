"use client";

import { useSyncExternalStore } from "react";

/** Fallback zone (Eastern, EST/EDT) used on the server and when the browser zone is unknown. */
export const DEFAULT_TIME_ZONE = "America/Toronto";

const PRESETS = {
  date: { dateStyle: "short" },
  dateLong: { dateStyle: "long" },
  dateMedium: { dateStyle: "medium" },
  dateTime: { dateStyle: "short", timeStyle: "short" },
  dateTimeMedium: { dateStyle: "medium", timeStyle: "short" },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

export type LocalTimePreset = keyof typeof PRESETS;

const subscribe = () => () => {};
const getBrowserZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
};
const getServerZone = () => DEFAULT_TIME_ZONE;

/**
 * Renders a timestamp in the viewer's own time zone. The server render (and the
 * first client paint) uses Eastern time, then it switches to the browser zone.
 */
export function LocalTime({
  value,
  preset = "dateTimeMedium",
  locale = "fr-CA",
}: {
  value: string | Date | null | undefined;
  preset?: LocalTimePreset;
  locale?: string;
}) {
  const zone = useSyncExternalStore(subscribe, getBrowserZone, getServerZone);
  if (!value) return <>—</>;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return <>—</>;
  return (
    <time dateTime={date.toISOString()} suppressHydrationWarning>
      {date.toLocaleString(locale, { ...PRESETS[preset], timeZone: zone })}
    </time>
  );
}
