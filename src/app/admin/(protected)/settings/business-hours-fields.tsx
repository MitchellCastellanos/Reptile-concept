"use client";

import { useState } from "react";
import {
  DAY_ORDER,
  DAY_LABELS,
  TIME_OPTIONS,
  formatWeeklyHours,
  type DayKey,
  type WeeklyHours,
} from "@/lib/business-hours";

export function BusinessHoursFields({ defaultWeeklyHours }: { defaultWeeklyHours: WeeklyHours }) {
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>(defaultWeeklyHours);

  function updateDay(day: DayKey, patch: Partial<WeeklyHours[DayKey]>) {
    setWeeklyHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {DAY_ORDER.map((day) => {
          const schedule = weeklyHours[day];
          return (
            <div key={day} className="flex flex-wrap items-center gap-3 text-sm">
              <span className="w-24 shrink-0 font-medium">{DAY_LABELS[day].fr}</span>

              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  name={`closed_${day}`}
                  checked={schedule.closed}
                  onChange={(e) => updateDay(day, { closed: e.target.checked })}
                />
                Fermé
              </label>

              <label className="flex items-center gap-1.5">
                De
                <select
                  name={`start_${day}`}
                  value={schedule.start}
                  disabled={schedule.closed}
                  onChange={(e) => updateDay(day, { start: e.target.value })}
                  className="rounded border border-black/20 px-2 py-1 disabled:opacity-40 dark:border-white/20 dark:bg-black"
                >
                  {TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-1.5">
                à
                <select
                  name={`end_${day}`}
                  value={schedule.end}
                  disabled={schedule.closed}
                  onChange={(e) => updateDay(day, { end: e.target.value })}
                  className="rounded border border-black/20 px-2 py-1 disabled:opacity-40 dark:border-white/20 dark:bg-black"
                >
                  {TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-zinc-600 dark:text-zinc-400">
        <p>Aperçu FR : {formatWeeklyHours(weeklyHours, "fr")}</p>
        <p>Preview EN : {formatWeeklyHours(weeklyHours, "en")}</p>
      </div>
    </div>
  );
}
