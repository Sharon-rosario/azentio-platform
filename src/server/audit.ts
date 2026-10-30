import "server-only";

import { now, run } from "./db";

type Actor = { actorId?: number | null; actor?: string; userId?: number; email?: string; orgId?: number | null };

/** Append-only audit row. Call it inside the same transaction as the change it records. */
export async function audit(who: Actor, action: string, entity: string, entityId: number | string | null, detail: object = {}) {
  await run("insert into audit (at,actor_id,actor,org_id,action,entity,entity_id,detail) values (?,?,?,?,?,?,?,?)",
    now(), who.actorId ?? who.userId ?? null, who.actor ?? who.email ?? "system", who.orgId ?? null, action, entity,
    entityId == null ? null : String(entityId), JSON.stringify(detail));
}

export async function notify(userId: number, text: string, link?: string) {
  await run("insert into notifications (user_id,text,link,created_at) values (?,?,?,?)", userId, text, link ?? null, now());
}
