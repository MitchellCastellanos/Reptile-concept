// The shop is open Mon–Sat (see Footer.hours in messages/*.json); only Sunday is closed.
export function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0) {
      added++;
    }
  }
  return result;
}
