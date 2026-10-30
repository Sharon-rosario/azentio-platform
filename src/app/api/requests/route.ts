import { createRequest } from "@/server/content";
import { body, oneOf, route } from "@/server/http";

export const POST = route(async ({ req }) => {
  const b = await body<{ kind: string; name?: string; email?: string; company?: string; message?: string }>(req);
  return { id: await createRequest(oneOf(b.kind, "kind", ["demo", "hackathon"] as const), b) };
});
