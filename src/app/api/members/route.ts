import { body, route } from "@/server/http";
import { invite, listMembers } from "@/server/members";

export const GET = route(({ req, p }) => {
  const org = new URL(req.url).searchParams.get("orgId");
  return listMembers(p, org ? Number(org) : undefined);
});
export const POST = route(async ({ req, p }) => invite(p, await body(req)));
