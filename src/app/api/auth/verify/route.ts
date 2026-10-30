import { verifyCode } from "@/server/auth";
import { body, route } from "@/server/http";

export const POST = route(async ({ req }) => {
  const { email, code } = await body<{ email: string; code: string }>(req);
  await verifyCode(email, code);
  return { ok: true };
});
