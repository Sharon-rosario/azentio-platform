import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { audit, notify } from "./audit";
import { all, insert, now, one, run, tx } from "./db";
import { authorize, can, CLIENT_ASSIGNABLE, HttpError, type Principal, type Role, ROLES } from "./policy";
import { DEMO_PERSONAS } from "./seed";

const INVITE_DAYS = 7;
const tokenHash = (t: string) => createHash("sha256").update(t).digest("hex");

export type Member = { id: number; name: string; email: string; roles: Role[]; status: string; created_at: string };
export type Invitation = { id: number; email: string; role: string; created_at: string; expires_at: string; state: string };

/** Members of the active organisation (client admins), or of any organisation (portal admins). */
export async function listMembers(p: Principal | null, orgId?: number) {
  const target = orgId ?? p?.orgId ?? 0;
  if (!can(p, "admin.orgs")) {
    authorize(p, "members.manage");
    if (target !== p.orgId) throw new HttpError(404, "Not found");
  }
  const members = (await all<Omit<Member, "roles"> & { roles: string }>(`select m.id, u.name, u.email, m.roles, m.status, m.created_at
    from memberships m join users u on u.id = m.user_id where m.org_id = ? order by m.status, u.name`, target))
    .map((m) => ({ ...m, roles: m.roles.split(",") as Role[] }));
  const invitations = (await all<Omit<Invitation, "state"> & { accepted_at: string | null; revoked_at: string | null }>(
    "select id, email, role, created_at, expires_at, accepted_at, revoked_at from invitations where org_id = ? order by id desc", target))
    .map(({ accepted_at, revoked_at, ...i }) => ({ ...i,
      state: accepted_at ? "Accepted" : revoked_at ? "Revoked" : i.expires_at < now() ? "Expired" : "Pending" }));
  return { members, invitations };
}

/**
 * Invite someone into an organisation. Client admins: only into their own, only client roles. The link is
 * single-use and expires; it names the organisation and role, and only works for the invited, verified email.
 */
export async function invite(p: Principal | null, input: { email?: unknown; role?: unknown; orgId?: unknown }) {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(422, "Enter a valid email address");
  let orgId = p?.orgId ?? 0;
  if (can(p, "admin.roles")) {
    if (input.orgId !== undefined && !Number.isInteger(input.orgId)) throw new HttpError(422, "orgId must be a number");
    orgId = (input.orgId as number | undefined) ?? orgId;
    if (!ROLES.includes(input.role as Role)) throw new HttpError(422, "Unknown role");
  } else {
    authorize(p, "members.manage");
    if (input.orgId && input.orgId !== p.orgId) throw new HttpError(404, "Not found");
    if (!CLIENT_ASSIGNABLE.includes(input.role as Role)) throw new HttpError(403, "You can only invite client members or client administrators");
  }
  const role = input.role as Role; // checked above against ROLES or CLIENT_ASSIGNABLE
  const org = await one<{ name: string }>("select name from organisations where id = ?", orgId);
  if (!org) throw new HttpError(404, "Not found");
  const token = randomBytes(24).toString("base64url");
  await tx(async () => {
    const id = await insert(`insert into invitations (org_id,email,role,token_hash,invited_by,created_at,expires_at)
      values (?,?,?,?,?,?,?)`, orgId, email, role, tokenHash(token), p!.userId, now(),
      new Date(Date.now() + INVITE_DAYS * 86_400_000).toISOString());
    await run("insert into outbox (to_email,subject,body,created_at) values (?,?,?,?)", email, `You're invited to ${org.name} on azentio.ai`,
      `${p!.name} invited you to join ${org.name} as ${role.replace("_", " ")}. Accept: /invite/${token} (single use, expires in ${INVITE_DAYS} days).`, now());
    await audit(p!, "member.invite", "invitation", id, { email, role, org: orgId });
  });
}

export async function invitationFor(token: string) {
  return one<{ id: number; org_id: number; org: string; email: string; role: string; expires_at: string; accepted_at: string | null;
    revoked_at: string | null }>(`select i.id, i.org_id, o.name as org, i.email, i.role, i.expires_at, i.accepted_at, i.revoked_at
    from invitations i join organisations o on o.id = i.org_id where i.token_hash = ?`, tokenHash(token));
}

/** Accept only as the invited, verified account. Joining is not consent to share anything. */
export async function acceptInvitation(p: Principal | null, token: string) {
  if (!p) throw new HttpError(401, "Sign in with the invited email first");
  const inv = await invitationFor(token);
  if (!inv || inv.accepted_at || inv.revoked_at || inv.expires_at < now()) throw new HttpError(410, "This invitation is no longer valid");
  if (inv.email !== p.email) throw new HttpError(403, `This invitation is for ${inv.email}. Sign in with that address`);
  await tx(async () => {
    await run("update invitations set accepted_at = ? where id = ?", now(), inv.id);
    const existing = await one<{ id: number }>("select id from memberships where user_id = ? and org_id = ?", p.userId, inv.org_id);
    if (existing) await run("update memberships set roles = ?, status = 'active' where id = ?", inv.role, existing.id);
    else await run("insert into memberships (user_id,org_id,roles,created_at) values (?,?,?,?)", p.userId, inv.org_id, inv.role, now());
    await audit(p, "member.accept", "invitation", inv.id, { org: inv.org_id, role: inv.role });
  });
  return inv.org;
}

/** Revoke a membership. Takes effect on the member's next request: sessions reload memberships every time. */
export async function revokeMember(p: Principal | null, membershipId: number) {
  const m = await one<{ id: number; org_id: number; user_id: number }>("select id, org_id, user_id from memberships where id = ?", membershipId);
  if (!m) throw new HttpError(404, "Not found");
  if (!can(p, "admin.roles")) {
    authorize(p, "members.manage");
    if (m.org_id !== p.orgId) throw new HttpError(404, "Not found");
  }
  if (m.user_id === p!.userId) throw new HttpError(409, "You can't remove yourself");
  await tx(async () => {
    await run("update memberships set status = 'revoked' where id = ?", membershipId);
    await audit(p!, "member.revoke", "membership", membershipId, { org: m.org_id });
    await notify(m.user_id, "Your access to an organisation on azentio.ai was removed");
  });
}

export async function auditLog(p: Principal | null, limit = 200) {
  authorize(p, "admin.audit");
  return all<{ id: number; at: string; actor: string; action: string; entity: string; entity_id: string | null; detail: string }>(
    "select id, at, actor, action, entity, entity_id, detail from audit order by id desc limit ?", limit);
}

export async function organisations(p: Principal | null) {
  authorize(p, "admin.orgs");
  return all<{ id: number; name: string; kind: string; industry: string; region: string; members: number }>(
    `select o.id, o.name, o.kind, o.industry, o.region, (select count(*)::int from memberships m where m.org_id = o.id and m.status='active') as members
     from organisations o order by o.id`);
}

export async function myNotifications(p: Principal | null) {
  if (!p) throw new HttpError(401, "Sign in first");
  return all<{ id: number; text: string; link: string | null; created_at: string; read_at: string | null }>(
    "select id, text, link, created_at, read_at from notifications where user_id = ? order by id desc limit 50", p.userId);
}

/**
 * Demo outbox: what would have been emailed, but only to synthetic addresses (the seeded personas and the reserved
 * .example domain, RFC 2606), so a code for a real person's mailbox is never shown, even in demo mode.
 */
export async function outbox() {
  const rows = await all<{ id: number; to_email: string; subject: string; body: string; created_at: string }>(
    "select * from outbox order by id desc limit 50");
  return rows.filter((m) => m.to_email.endsWith(".example") || DEMO_PERSONAS.has(m.to_email));
}
