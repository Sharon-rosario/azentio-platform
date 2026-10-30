import { DEMO_MODE, requestCode } from "@/server/auth";
import { body, route, text } from "@/server/http";

export const POST = route(async ({ req }) => {
  const b = await body<{ email?: unknown }>(req);
  await requestCode(text(b.email, "Email", { max: 254 }));
  return { ok: true, demoOutbox: DEMO_MODE };
});
