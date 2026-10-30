import { DEMO_MODE, requestCode } from "@/server/auth";
import { body, route } from "@/server/http";

export const POST = route(async ({ req }) => {
  const { email } = await body<{ email: string }>(req);
  await requestCode(email);
  return { ok: true, demoOutbox: DEMO_MODE };
});
