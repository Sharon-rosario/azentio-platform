import { verifyCode } from "@/server/auth";
import { body, route, text } from "@/server/http";

export const POST = route(async ({ req }) => {
  const b = await body<{ email?: unknown; code?: unknown }>(req);
  await verifyCode(text(b.email, "Email", { max: 254 }), text(b.code, "Code", { max: 12 }));
  return { ok: true };
});
