import { fingerprint } from "@/server/auth";
import { createRequest } from "@/server/content";
import { body, oneOf, route } from "@/server/http";

export const POST = route(async ({ req }) => {
  const b = await body<{ kind?: unknown; name?: unknown; email?: unknown; company?: unknown; message?: unknown }>(req);
  // Vercel sets x-real-ip to the connecting client and overwrites any value a client sends; locally there is none.
  const source = fingerprint(req.headers.get("x-real-ip") ?? "local");
  return { id: await createRequest(oneOf(b.kind, "kind", ["demo", "hackathon"] as const), b, source) };
});
