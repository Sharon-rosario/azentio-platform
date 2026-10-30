// Unit tests for the pure safeguards (no server needed): sensitive-content scanning and quote verification.
// Node 24 runs the TypeScript sources directly (type stripping).
import assert from "node:assert/strict";
import { test } from "node:test";

import { safePath } from "../src/lib/safe-path.ts";
import { GENESIS, rowHash, verifyChain } from "../src/server/audit-chain.ts";
import { isIdle, needsTouch } from "../src/server/session-policy.ts";
import { locate } from "../src/server/evidence.ts";
import { scan } from "../src/server/scan.ts";

test("scan flags identifiers that must not reach the shared feed", () => {
  const kinds = (t) => scan(t).map((f) => f.kind).sort();
  assert.deepEqual(kinds("Mail ops.desk@bank.example for the file"), ["email address"]);
  assert.deepEqual(kinds("Account 004512339871 was affected"), ["account or card number"]);
  assert.deepEqual(kinds("Borrower PAN ABCDE1234F"), ["PAN (India tax id)"]);
  assert.deepEqual(kinds("IBAN AE070331234567890123456"), ["IBAN"]);
  assert.ok(kinds("Call +91 98765 43210 today").includes("phone number"));
});

test("scan leaves ordinary market observations alone", () => {
  assert.deepEqual(scan("Seasonal SMEs show 30-40% revenue dips in Q2 2026 across 400 accounts."), []);
});

test("locate finds exact and lightly garbled quotes, rejects invented or trivial ones", () => {
  const source = "Our scorecards treat a single low quarter as deterioration, so seasonal businesses get declined.";
  assert.equal(locate("treat a single low quarter as deterioration", source), 1);
  assert.ok(locate("treat a singel low quarter as deterioration", source) >= 0.85);
  assert.equal(locate("the bank lost money on every seasonal loan", source), 0);
  assert.equal(locate("scorecards treat", source), 0, "quotes under three words prove nothing");
});

test("safePath allows same-origin paths only (no open redirect)", () => {
  for (const ok of ["/portal", "/portal/themes?x=1", "/"]) assert.equal(safePath(ok), ok);
  for (const bad of ["//evil.example", "/\\evil.example", "https://evil.example", "javascript:alert(1)", "portal",
    "/portal\nSet-Cookie: x", "", null, undefined, 42, ["/portal"]]) {
    assert.equal(safePath(bad), null, String(bad));
  }
});

test("sessions end after the idle limit, and activity is recorded at most once a minute", () => {
  const now = Date.parse("2026-10-30T12:00:00Z");
  const ago = (min) => new Date(now - min * 60_000).toISOString();
  assert.equal(isIdle(ago(29), now, 30), false, "29 minutes idle: still signed in");
  assert.equal(isIdle(ago(31), now, 30), true, "31 minutes idle: signed out");
  assert.equal(needsTouch(ago(0.5), now), false, "no write for activity within the last minute");
  assert.equal(needsTouch(ago(2), now), true);
});

test("the audit hash chain detects an edited, removed or inserted entry", () => {
  const rows = [];
  let prev = GENESIS;
  for (const [i, action] of ["auth.sign_in", "observation.create", "moderation.publish"].entries()) {
    const r = { id: i + 1, at: `2026-10-30T10:0${i}:00Z`, actor_id: 1, actor: "a@b.example", org_id: null, action,
      entity: "x", entity_id: String(i), detail: "{}" };
    const hash = rowHash(prev, r);
    rows.push({ ...r, prev_hash: prev, hash });
    prev = hash;
  }
  assert.equal(verifyChain(rows).ok, true);
  assert.equal(verifyChain(rows).checked, 3);
  const edited = rows.map((r) => (r.id === 2 ? { ...r, detail: '{"note":"changed"}' } : r));
  assert.equal(verifyChain(edited).brokenAt, 2, "an edited entry");
  assert.equal(verifyChain([rows[0], rows[2]]).brokenAt, 3, "a removed entry");
  const forged = { ...rows[1], id: 9, action: "forged", hash: rowHash(rows[0].hash, { ...rows[1], action: "forged" }) };
  assert.equal(verifyChain([rows[0], forged, rows[1], rows[2]]).ok, false, "an inserted entry");
});
