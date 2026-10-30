import { switchWorkspace } from "@/server/auth";
import { body, route } from "@/server/http";
import { HttpError } from "@/server/policy";

export const POST = route(async ({ req, p }) => {
  if (!p) throw new HttpError(401, "Sign in first");
  const { membershipId } = await body<{ membershipId?: unknown }>(req);
  if (!Number.isInteger(membershipId)) throw new HttpError(422, "membershipId must be a number");
  await switchWorkspace(p, membershipId as number);
  return { ok: true };
});
