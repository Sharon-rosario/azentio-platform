import { switchWorkspace } from "@/server/auth";
import { body, route } from "@/server/http";
import { HttpError } from "@/server/policy";

export const POST = route(async ({ req, p }) => {
  if (!p) throw new HttpError(401, "Sign in first");
  const { membershipId } = await body<{ membershipId: number }>(req);
  await switchWorkspace(p, Number(membershipId));
  return { ok: true };
});
