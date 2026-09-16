import { Lang } from "./i18n";

const WEEKDAY_SHORT: Record<Lang, string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  de: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
};

const MONTHS: Record<Lang, string[]> = {
  en: [
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
  ],
  de: [
    "Januar",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ],
  ru: [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ],
};

export interface WorkDay {
  iso: string; // YYYY-MM-DD
  label: string; // e.g. "Tue, 18 September"
}

function formatIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Next `count` working days (Mon-Sat), starting tomorrow, labeled in the given language. */
export function getNextWorkingDays(count: number, lang: Lang): WorkDay[] {
  const result: WorkDay[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  while (result.length < count) {
    const weekday = cursor.getDay(); // 0 = Sunday
    if (weekday !== 0) {
      result.push({
        iso: formatIso(cursor),
        label: `${WEEKDAY_SHORT[lang][weekday]}, ${cursor.getDate()} ${MONTHS[lang][cursor.getMonth()]}`,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}
