// Unit tests for the pure safeguards (no server needed): sensitive-content scanning and quote verification.
// Node 24 runs the TypeScript sources directly (type stripping).
import assert from "node:assert/strict";
import { test } from "node:test";

import { applyRedactions, safeReplacement, safeRewrite } from "../src/lib/redact.ts";
import { safePath } from "../src/lib/safe-path.ts";
import { GENESIS, rowHash, verifyChain } from "../src/server/audit-chain.ts";
import { isIdle, needsTouch } from "../src/server/session-policy.ts";
import { locate, verbatim } from "../src/server/evidence.ts";
import { scan } from "../src/server/scan.ts";

test("scan flags identifiers that must not reach the shared feed", () => {
  const kinds = (t) => scan(t).map((f) => f.kind).sort();
  assert.deepEqual(kinds("Mail ops.desk@bank.example for the file"), ["email address"]);
  assert.deepEqual(kinds("Account 004512339871 was affected"), ["account or card number"]);
  assert.deepEqual(kinds("Borrower PAN ABCDE1234F"), ["PAN (India tax id)"]);
  assert.deepEqual(kinds("IBAN AE070331234567890123456"), ["IBAN"]);
  assert.ok(kinds("Call +91 98765 43210 today").includes("phone number"));
  assert.deepEqual(kinds("Account 4455 6677 8899 was affected"), ["account or card number"], "grouped digits are an account, not a phone");
});

test("scan leaves ordinary market observations alone", () => {
  assert.deepEqual(scan("Seasonal SMEs show 30-40% revenue dips in Q2 2026 across 400 accounts."), []);
});

test("verbatim keeps a quote only when its words are in the source, and returns the source's own words", () => {
  const source = "Our scorecards do not treat a single low quarter as deterioration, so seasonal businesses get declined.";
  assert.equal(verbatim("DO NOT treat a single low-quarter as deterioration", source), "do not treat a single low quarter as deterioration");
  assert.equal(verbatim("do now treat a single low quarter as deterioration", source), null, "one changed word can reverse the meaning");
  assert.equal(verbatim("scorecards do treat a single low quarter", source), null, "a dropped 'not' is a different claim");
  assert.equal(verbatim("the bank lost money on every seasonal loan", source), null);
  assert.equal(verbatim("seasonal businesses get declined", source), null, "quotes under five words prove nothing");
});

test("locate keeps an AI identifier finding only when it is really in the copy, in the copy's own characters", () => {
  const copy = "Ask Sara at Meridian Bank, or write to s a r a (at) meridian [dot] example. Call nine 8 7 6 5 - 4 3 2 1 0.";
  assert.equal(locate("meridian bank", copy), "Meridian Bank");
  assert.equal(locate("s a r a (at) meridian [dot] example", copy), "s a r a (at) meridian [dot] example");
  assert.equal(locate("nine 8 7 6 5 - 4 3 2 1 0", copy), "nine 8 7 6 5 - 4 3 2 1 0");
  assert.equal(locate("Kestrel Finance", copy), null, "a name that isn't in the copy is dropped");
  assert.equal(locate("sara@meridian.example", copy), null, "the model's tidied-up version doesn't count");
  assert.equal(locate(" ", copy), null);
});

test("removing identifiers replaces exactly what was found, and AI wording that would identify someone is refused", () => {
  const changes = [
    { text: "kestrelfinance", replacement: "a lender" },
    { text: "rbi.desk@kestrelfinance.example", replacement: "[contact removed]" },
    { text: "Meridian Bank", replacement: "a mid-size bank" },
  ];
  assert.equal(
    applyRedactions("meridian bank saw it; mail rbi.desk@kestrelfinance.example. Meridian Bank agrees.", changes),
    "A mid-size bank saw it; mail [contact removed]. A mid-size bank agrees.",
    "every occurrence in any case, the email before the name inside it, and capitalised at a sentence start",
  );
  assert.equal(applyRedactions("Cost was $5", [{ text: "Cost", replacement: "$& price" }]), "$& price was $5", "replacement is literal text");
  const flagged = (t) => scan(t).length > 0;
  assert.equal(safeReplacement("the onboarding desk", "[contact removed]", ["ops@bank.example"], flagged), "the onboarding desk");
  assert.equal(safeReplacement("Meridian's team", "a financial institution", ["Meridian"], flagged), "a financial institution", "repeats the identifier");
  assert.equal(safeReplacement("call 98765 43210", "[contact removed]", [], flagged), "[contact removed]", "the scanner flags it");
  assert.equal(safeReplacement("  ", "[number removed]", [], flagged), "[number removed]");
});

test("AIRA's rewritten copy is used only when none of the identifiers it found survive and the scanner flags nothing", () => {
  const flagged = (t) => scan(t).length > 0;
  const found = ["Meridian Bank", "sara dot ahmed at meridianbank dot example"];
  const ok = { title: "KYC onboarding stalls on incomplete documents", body: "A mid-size bank sees SME files stall for weeks." };
  assert.deepEqual(safeRewrite(ok, found, flagged), ok);
  assert.equal(safeRewrite({ ...ok, body: "At meridian bank, files stall." }, found, flagged), null, "an identifier survived (any case)");
  assert.equal(safeRewrite({ ...ok, body: "Call 98765 43210 for the list." }, found, flagged), null, "the scanner flags it");
  assert.equal(safeRewrite({ ...ok, title: "" }, found, flagged), null, "a field is empty");
  assert.equal(safeRewrite({ ...ok, title: "x".repeat(141) }, found, flagged), null, "the title is too long");
  assert.equal(safeRewrite(undefined, found, flagged), null);
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
