import "server-only";

import { notFound, redirect } from "next/navigation";

import { getPrincipal } from "./auth";
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
      if (e.status === 401) redirect(`/login?next=${encodeURIComponent(next)}`);
      if (e.status === 404) notFound();
      if (e.status === 403) return { forbidden: e.message };
    }
    throw e;
  }
}

export const isForbidden = (x: unknown): x is { forbidden: string } => !!x && typeof x === "object" && "forbidden" in x;
