// Tamper evidence for the audit log (no I/O; shared by audit.ts, db.ts, members.ts and the unit tests).
// Each row's hash covers the previous row's hash and the row's own fields, so changing, deleting or inserting any row
// breaks every hash after it. It detects tampering; it does not prevent it, so the head hash can be recorded elsewhere.
import { createHash } from "node:crypto";

export type AuditFields = {
  at: string; actor_id: number | null; actor: string; org_id: number | null; action: string; entity: string;
  entity_id: string | null; detail: string;
};
export type ChainRow = AuditFields & { id: number; prev_hash: string | null; hash: string | null };

/** The chain's starting point: the "previous hash" of the very first row. */
export const GENESIS = "0".repeat(64);
/** Advisory lock id that serialises appends, so two writers never chain onto the same previous row. */
export const AUDIT_LOCK = 74_120_031;

export function rowHash(prev: string, r: AuditFields): string {
  return createHash("sha256")
    .update(JSON.stringify([prev, r.at, r.actor_id, r.actor, r.org_id, r.action, r.entity, r.entity_id, r.detail]))
    .digest("hex");
}

/** Walk the rows in id order and report the first one whose link or hash doesn't match. */
export function verifyChain(rows: ChainRow[]): { ok: boolean; checked: number; brokenAt: number | null; head: string } {
  let prev = GENESIS;
  for (const [i, r] of rows.entries()) {
    if (r.prev_hash !== prev || r.hash !== rowHash(prev, r)) return { ok: false, checked: i, brokenAt: r.id, head: prev };
    prev = r.hash;
  }
  return { ok: true, checked: rows.length, brokenAt: null, head: prev };
}
