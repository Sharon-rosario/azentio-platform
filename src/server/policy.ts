import "server-only";

// The only place that decides who may do what. Deny by default: an action not listed for one of the active
// membership's roles is refused, whatever the UI shows. Pages and API routes both go through `authorize`.

export const ROLES = ["employee", "product_owner", "moderator", "publisher", "portal_admin", "client_member", "client_admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  employee: "Employee",
  product_owner: "Product owner",
  moderator: "Learning moderator",
  publisher: "Content publisher",
  portal_admin: "Portal administrator",
  client_member: "Client member",
  client_admin: "Client administrator",
};

const GRANTS: Record<Role, string[]> = {
  employee: ["content.employee", "shared.read", "themes.read", "ideas.read", "ideas.suggest", "playground.use"],
  product_owner: ["ideas.write", "themes.synthesize"],
  moderator: ["moderation.review", "reports.decide", "themes.synthesize", "themes.counts"],
  publisher: ["content.publish"],
  // Administers organisations and roles. Deliberately no right to read client observations: that needs moderation.
  portal_admin: ["admin.orgs", "admin.roles", "admin.audit"],
  client_member: ["content.client", "observations.write", "observations.org", "shared.read", "themes.read", "ideas.read", "reports.create"],
  client_admin: ["content.client", "observations.write", "observations.org", "shared.read", "themes.read", "ideas.read", "reports.create",
    "members.manage"],
};

// Which roles a client administrator may hand out: never a platform role.
export const CLIENT_ASSIGNABLE: Role[] = ["client_member", "client_admin"];

export type Principal = {
  userId: number;
  email: string;
  name: string;
  membershipId: number | null;
  orgId: number | null;
  orgName: string | null;
  orgKind: "internal" | "client" | null;
  roles: Role[];
  perms: Set<string>;
  memberships: { id: number; orgId: number; orgName: string; kind: string; roles: Role[] }[];
};

export function permsFor(roles: Role[]): Set<string> {
  return new Set(roles.flatMap((r) => GRANTS[r] ?? []));
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function can(p: Principal | null, perm: string): boolean {
  return !!p && p.perms.has(perm);
}

/** Throws 401 when signed out, 403 when the active membership lacks the permission. */
export function authorize(p: Principal | null, perm: string): asserts p is Principal {
  if (!p) throw new HttpError(401, "Sign in first");
  if (!p.perms.has(perm)) throw new HttpError(403, "You don't have access to this");
}

/** Tenant check for anything owned by an organisation. A wrong tenant looks like "not found", so ids can't be probed. */
export function sameTenant(p: Principal, orgId: number) {
  if (p.orgId !== orgId) throw new HttpError(404, "Not found");
}

/** Audience rule for content: public is explicit, unknown audience means deny. */
export function canSeeContent(p: Principal | null, c: { audience: string; product: string | null }, entitled: Set<string>) {
  if (c.audience === "public") return true;
  if (c.audience === "employee") return can(p, "content.employee");
  if (c.audience === "client") return can(p, "content.client") && (!c.product || entitled.has(c.product));
  return false;
}
