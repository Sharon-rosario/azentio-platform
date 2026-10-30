import "server-only";

import { AUDIT_LOCK, GENESIS, rowHash, type AuditFields } from "./audit-chain";
import { now, one, run, tx } from "./db";

type Actor = { actorId?: number | null; actor?: string; userId?: number; email?: string; orgId?: number | null };

/**
 * Append-only, hash-chained audit row. Call it inside the same transaction as the change it records. The advisory
 * lock serialises appends, so each row chains onto the true latest row and the chain never forks.
 */
export async function audit(who: Actor, action: string, entity: string, entityId: number | string | null, detail: object = {}) {
  const row: AuditFields = {
    at: now(), actor_id: who.actorId ?? who.userId ?? null, actor: who.actor ?? who.email ?? "system", org_id: who.orgId ?? null,
    action, entity, entity_id: entityId == null ? null : String(entityId), detail: JSON.stringify(detail),
  };
  await tx(async () => {
    await run(`select pg_advisory_xact_lock(${AUDIT_LOCK})`);
    const prev = (await one<{ hash: string | null }>("select hash from audit order by id desc limit 1"))?.hash ?? GENESIS;
    await run("insert into audit (at,actor_id,actor,org_id,action,entity,entity_id,detail,prev_hash,hash) values (?,?,?,?,?,?,?,?,?,?)",
      row.at, row.actor_id, row.actor, row.org_id, row.action, row.entity, row.entity_id, row.detail, prev, rowHash(prev, row));
  });
}

export async function notify(userId: number, text: string, link?: string) {
  await run("insert into notifications (user_id,text,link,created_at) values (?,?,?,?)", userId, text, link ?? null, now());
}
