// Work-log day-boundary math. Per spec, "today or yesterday" and all report
// ranges use Africa/Addis_Ababa time (UTC+3, no DST).

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 'YYYY-MM-DD' for an epoch-ms moment, in EAT. */
export function eatDateKey(ms: number): string {
  return new Date(ms + EAT_OFFSET_MS).toISOString().slice(0, 10);
}

export function todayKey(now: number = Date.now()): string {
  return eatDateKey(now);
}

export function shiftDateKey(key: string, days: number): string {
  return new Date(Date.parse(key + 'T00:00:00Z') + days * DAY_MS).toISOString().slice(0, 10);
}

export function yesterdayKey(now: number = Date.now()): string {
  return shiftDateKey(todayKey(now), -1);
}

/** Manual entries dated before yesterday (EAT) require approval. */
export function isLateEntryDate(entryDate: string, now: number = Date.now()): boolean {
  return entryDate < yesterdayKey(now);
}

/** Epoch ms of local-midnight EAT for a date key. */
export function startOfDayMs(dateKey: string): number {
  return Date.parse(dateKey + 'T00:00:00Z') - EAT_OFFSET_MS;
}

/** [mondayKey, sundayKey] of the EAT week containing the anchor key. */
export function weekRangeKeys(anchorKey: string): [string, string] {
  const weekday = new Date(anchorKey + 'T00:00:00Z').getUTCDay(); // 0=Sun..6=Sat
  const monday = shiftDateKey(anchorKey, -((weekday + 6) % 7));
  return [monday, shiftDateKey(monday, 6)];
}

/** [firstKey, lastKey] of the EAT calendar month containing the anchor key. */
export function monthRangeKeys(anchorKey: string): [string, string] {
  const year = Number(anchorKey.slice(0, 4));
  const month = Number(anchorKey.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return [`${anchorKey.slice(0, 7)}-01`, `${anchorKey.slice(0, 7)}-${String(lastDay).padStart(2, '0')}`];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** H:MM:SS at or above an hour, otherwise M:SS. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatDurationMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** 'HH:MM' wall-clock time in EAT for an epoch-ms moment. */
export function formatClock(ms: number): string {
  return new Date(ms + EAT_OFFSET_MS).toISOString().slice(11, 16);
}

/** 'Mon, Sep 4' style label for a date key. */
export function formatDayLabel(key: string): string {
  const d = new Date(key + 'T00:00:00Z');
  return `${DAY_NAMES[d.getUTCDay()]}, ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
