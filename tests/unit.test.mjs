// Unit tests for the pure safeguards (no server needed): sensitive-content scanning and quote verification.
// Node 24 runs the TypeScript sources directly (type stripping).
import assert from "node:assert/strict";
import { test } from "node:test";

import { safePath } from "../src/lib/safe-path.ts";
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
