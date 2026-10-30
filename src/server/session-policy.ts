// Pure session timing rules (no I/O), shared by auth.ts and the unit tests.

/** Sign-in lasts at most this long, however active the session is. */
export const SESSION_HOURS = 8;
/** A session unused for this long is ended; SESSION_IDLE_MINUTES overrides it. */
export const IDLE_MINUTES = Number(process.env.SESSION_IDLE_MINUTES ?? 30);
/** Activity is recorded at most this often, so ordinary browsing doesn't write on every request. */
export const TOUCH_SECONDS = 60;

/** True when the session has been unused longer than the idle limit. */
export function isIdle(lastSeen: string, now: number, idleMinutes = IDLE_MINUTES): boolean {
  return now - new Date(lastSeen).getTime() > idleMinutes * 60_000;
}

/** True when the last-seen time is old enough to be worth updating. */
export function needsTouch(lastSeen: string, now: number): boolean {
  return now - new Date(lastSeen).getTime() > TOUCH_SECONDS * 1000;
}
