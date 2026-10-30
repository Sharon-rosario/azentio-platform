import { route } from "@/server/http";

export const GET = route(({ p }) =>
  p
    ? { signedIn: true, name: p.name, email: p.email, org: p.orgName, roles: p.roles, perms: [...p.perms],
        memberships: p.memberships.map((m) => ({ id: m.id, org: m.orgName, roles: m.roles })), active: p.membershipId }
    : { signedIn: false });
