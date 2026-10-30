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

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "Send a JSON body");
  }
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
