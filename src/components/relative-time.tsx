"use client";

import { useSyncExternalStore } from "react";

import { dateTime, relative } from "@/lib/format";

// One shared minute ticker for every relative time on the page.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
function subscribe(l: () => void) {
  listeners.add(l);
  timer ??= setInterval(() => listeners.forEach((f) => f()), 60_000);
  return () => {
    listeners.delete(l);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}
const minute = () => Math.floor(Date.now() / 60_000);

/**
 * "5 minutes ago" that stays correct: the server and the browser compute it a moment apart, so
 * the first paint may differ by a minute (hydration warning suppressed for this element only),
 * then it re-renders from the browser's clock and every minute after. Hover shows the exact time.
 */
export function RelativeTime({ iso, className }: { iso: string | null | undefined; className?: string }) {
  useSyncExternalStore(subscribe, minute, () => 0);
  if (!iso) return <span className={className}>—</span>;
  return (
    <time dateTime={iso} title={dateTime(iso)} className={className} suppressHydrationWarning>
      {relative(iso)}
    </time>
  );
}
