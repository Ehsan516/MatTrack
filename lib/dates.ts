export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export type DayName = typeof DAYS[number];

const JS_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const todayName = (): DayName => JS_WEEK[new Date().getDay()];

/** The next seven days in calendar order, starting with today. */
export const daysFromToday = (): DayName[] => {
  const start = DAYS.indexOf(todayName());
  return [...DAYS.slice(start), ...DAYS.slice(0, start)];
};

/** The next calendar date (today included) that falls on the given weekday, at local midnight. */
export const nextDateForDay = (dayName: string): Date => {
  const now = new Date();
  let diff = JS_WEEK.indexOf(dayName as DayName) - now.getDay();
  if (diff < 0) diff += 7;

  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
};

/**
 * YYYY-MM-DD in local time. `toISOString()` converts to UTC first, which
 * shifts local midnight onto the previous day for anyone east of GMT.
 */
export const toLocalISODate = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const buildDateTime = (baseDate: Date, hhmm: string): Date => {
  const [h, m] = (hhmm || '00:00').split(':').map(Number);
  const dt = new Date(baseDate);
  dt.setHours(h || 0, m || 0, 0, 0);
  return dt;
};

/** "18:00:00" -> "18:00" */
export const shortTime = (hhmm: string) => (hhmm || '').slice(0, 5);

export const formatShortDate = (value: string | Date) =>
  new Date(value).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export const timeAgo = (value: string) => {
  const mins = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};
