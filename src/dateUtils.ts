const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface WorkDay {
  iso: string; // YYYY-MM-DD
  label: string; // "Tue, 18 September"
}

function formatIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Next `count` working days (Mon-Sat), starting tomorrow. */
export function getNextWorkingDays(count: number): WorkDay[] {
  const result: WorkDay[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  while (result.length < count) {
    const weekday = cursor.getDay(); // 0 = Sunday
    if (weekday !== 0) {
      result.push({
        iso: formatIso(cursor),
        label: `${WEEKDAY_SHORT[weekday]}, ${cursor.getDate()} ${MONTHS[cursor.getMonth()]}`,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}
