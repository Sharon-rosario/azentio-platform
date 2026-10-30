import "server-only";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { COOKIE, getPrincipal } from "./auth";
import { HttpError, type Principal } from "./policy";

/**
 * Server pages call the same services as the API, so the same `authorize` decides. Signed out → sign-in page,
 * not allowed → the 403 view, not found (or another tenant's) → 404.
 */
export async function load<T>(fn: (p: Principal | null) => Promise<T>, next = "/portal"): Promise<T | { forbidden: string }> {
  const p = await getPrincipal();
  try {
    return await fn(p);
  } catch (e) {
    if (e instanceof HttpError) {
      if (e.status === 401) redirect(await signInPath(next));
      if (e.status === 404) notFound();
      if (e.status === 403) return { forbidden: e.message };
    }
    throw e;
  }
}

/**
 * Where to send someone who isn't signed in. A session cookie still in the browser means a session existed and has
 * ended (idle timeout or revoked), so the sign-in page can say why they're there; signing out clears the cookie.
 */
export async function signInPath(next: string) {
  const ended = (await cookies()).has(COOKIE);
  return `/login?next=${encodeURIComponent(next)}${ended ? "&ended=1" : ""}`;
}

export const isForbidden = (x: unknown): x is { forbidden: string } => !!x && typeof x === "object" && "forbidden" in x;
