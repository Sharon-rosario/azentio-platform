import "server-only";

import { NextResponse } from "next/server";

import { getPrincipal } from "./auth";
import { HttpError, type Principal } from "./policy";

type Handler<C> = (ctx: { req: Request; p: Principal | null; params: C }) => Promise<unknown> | unknown;

/**
 * Every API route goes through here: one error shape ({detail}), the principal loaded from the session, and a
 * same-origin check on writes (with the SameSite cookie, this blocks cross-site request forgery).
 */
export function route<C = Record<string, string>>(handler: Handler<C>) {
  return async (req: Request, ctx: { params: Promise<C> }) => {
    try {
      if (req.method !== "GET") {
        const origin = req.headers.get("origin");
        const host = req.headers.get("host");
        if (origin && host && new URL(origin).host !== host) throw new HttpError(403, "Cross-site request refused");
      }
      const p = await getPrincipal();
      const out = await handler({ req, p, params: (await ctx.params) ?? ({} as C) });
      return out instanceof Response ? out : NextResponse.json(out ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ detail: e.message }, { status: e.status });
      console.error(e);
      return NextResponse.json({ detail: "Something went wrong on our side" }, { status: 500 });
    }
  };
}

/** The request's JSON body. Anything other than a JSON object (null, an array, a bare string) is refused with 400. */
export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    throw new HttpError(400, "Send a JSON body");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new HttpError(400, "Send a JSON object");
  return parsed as T;
}

/** A numeric path id. Anything else answers 404, the same as a record that doesn't exist, so ids can't be probed. */
export function id(raw: string): number {
  if (!/^[1-9]\d{0,9}$/.test(raw) || Number(raw) > 2_147_483_647) throw new HttpError(404, "Not found");
  return Number(raw);
}

/** Trimmed string with a length limit, checked on the server (the client checks too, but that's for convenience). */
export function text(value: unknown, field: string, { min = 1, max = 500 } = {}): string {
  const s = typeof value === "string" ? value.trim() : "";
  if (s.length < min) throw new HttpError(422, `${field} is required`);
  if (s.length > max) throw new HttpError(422, `${field} must be under ${max} characters`);
  return s;
}

export function oneOf<T extends string>(value: unknown, field: string, options: readonly T[]): T {
  if (!options.includes(value as T)) throw new HttpError(422, `${field} must be one of: ${options.join(", ")}`);
  return value as T;
}
