import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * False while the server renders and during hydration, true after. Use it to gate browser-only
 * data (a live health check, the clock) shown inside server-rendered, streamed content: that data
 * can arrive before the streamed part hydrates, and would otherwise mismatch the server's HTML.
 */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
