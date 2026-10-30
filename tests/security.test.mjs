// Access-control tests against the running app: sign in as different people and try to reach what they mustn't,
// straight through the API (no UI). Run with the dev server up: `npm run dev` then `npm run test:security`.
import assert from "node:assert/strict";
import { test } from "node:test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function call(path, { cookie, method = "GET", body, origin } = {}) {
  const headers = { "content-type": "application/json" };
  if (cookie) headers.cookie = cookie;
  if (origin) headers.origin = origin;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined, redirect: "manual" });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, res };
}

const sessions = {};
/** Sign in with the email-code flow; the code is read from the demo outbox (DEMO_MODE). */
async function login(email) {
  if (sessions[email]) return sessions[email];
  assert.equal((await call("/api/auth/code", { method: "POST", body: { email } })).status, 200);
  const mail = (await call("/api/dev/outbox")).data.find((m) => m.to_email === email && m.subject.includes("sign-in"));
  const code = mail.body.match(/\b(\d{6})\b/)[1];
  const r = await call("/api/auth/verify", { method: "POST", body: { email, code } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  const cookie = r.res.headers.get("set-cookie").split(";")[0];
  sessions[email] = cookie;
  return cookie;
}

const SARA = "sara@meridianbank.example"; // Meridian, client member
const RAVI = "ravi@meridianbank.example"; // Meridian, client admin
const CHEN = "chen@kestrelfinance.example"; // Kestrel, client member
const MAYA = "maya@advisory.example"; // member of Kestrel and Harbourline
const OMAR = "omar@azentio.com"; // moderator
const ADMIN = "admin@azentio.com"; // portal admin
const DEV = "dev@azentio.com"; // plain employee
const PRIYA = "priya@azentio.com"; // product owner

test("signed out: only public content, everything else refused", async () => {
  const content = (await call("/api/content")).data;
  assert.ok(content.length > 0 && content.every((c) => c.audience === "public"));
  for (const path of ["/api/shared", "/api/observations", "/api/themes", "/api/moderation", "/api/admin/audit", "/api/members"]) {
    assert.equal((await call(path)).status, 401, path);
  }
});

test("a wrong code is refused, and a code works once", async () => {
  const email = "nobody@test.example";
  await call("/api/auth/code", { method: "POST", body: { email } });
  assert.equal((await call("/api/auth/verify", { method: "POST", body: { email, code: "000000" } })).status, 400);
  const code = (await call("/api/dev/outbox")).data.find((m) => m.to_email === email).body.match(/\b(\d{6})\b/)[1];
  assert.equal((await call("/api/auth/verify", { method: "POST", body: { email, code } })).status, 200);
  assert.equal((await call("/api/auth/verify", { method: "POST", body: { email, code } })).status, 400);
});

test("a new verified email gets no organisation: no tenant is trusted by default", async () => {
  const cookie = await login("stranger@test.example");
  const me = (await call("/api/me", { cookie })).data;
  assert.equal(me.signedIn, true);
  assert.equal(me.org, null);
  assert.equal((await call("/api/shared", { cookie })).status, 403);
});

test("tenant isolation: another organisation's observation is not found, even by id", async () => {
  const chen = await login(CHEN);
  const sara = await login(SARA);
  const kestrelId = (await call("/api/observations", { cookie: chen })).data[0].id;
  assert.equal((await call(`/api/observations/${kestrelId}`, { cookie: sara })).status, 404);
  assert.equal((await call(`/api/observations/${kestrelId}`, { cookie: sara, method: "PATCH", body: { title: "x" } })).status, 404);
  assert.equal((await call(`/api/observations/${kestrelId}/withdraw`, { cookie: sara, method: "POST" })).status, 404);
});

test("a private draft stays private, even inside the same organisation", async () => {
  const sara = await login(SARA);
  const ravi = await login(RAVI);
  const draft = (await call("/api/observations", { cookie: sara })).data.find((o) => o.visibility === "private");
  assert.ok(draft, "seed has a private draft");
  assert.equal((await call(`/api/observations/${draft.id}`, { cookie: ravi })).status, 404);
  const orgList = (await call("/api/observations?scope=org", { cookie: ravi })).data;
  assert.ok(!orgList.some((o) => o.id === draft.id));
});

test("roles: clients can't moderate or administer; admins can't read client observations", async () => {
  const sara = await login(SARA);
  assert.equal((await call("/api/moderation", { cookie: sara })).status, 403);
  assert.equal((await call("/api/admin/audit", { cookie: sara })).status, 403);
  assert.equal((await call("/api/members", { cookie: sara })).status, 403);
  const admin = await login(ADMIN);
  assert.equal((await call("/api/observations", { cookie: admin })).status, 403);
  assert.equal((await call("/api/moderation", { cookie: admin })).status, 403);
  const dev = await login(DEV);
  assert.equal((await call("/api/ideas", { cookie: dev, method: "POST", body: { title: "x" } })).status, 403);
});

test("a moderator never sees unsubmitted drafts", async () => {
  const sara = await login(SARA);
  const omar = await login(OMAR);
  const draft = (await call("/api/observations", { cookie: sara })).data.find((o) => o.status === "draft");
  assert.equal((await call(`/api/moderation/${draft.id}`, { cookie: omar })).status, 404);
  const queue = (await call("/api/moderation", { cookie: omar })).data.items;
  assert.ok(queue.every((o) => o.status === "submitted" && o.visibility === "community"));
});

test("client admins can't escalate or reach another tenant", async () => {
  const ravi = await login(RAVI);
  const toModerator = await call("/api/members", { cookie: ravi, method: "POST", body: { email: "x@meridianbank.example", role: "moderator" } });
  assert.equal(toModerator.status, 403);
  const otherOrg = await call("/api/members", { cookie: ravi, method: "POST", body: { email: "y@x.example", role: "client_member", orgId: 3 } });
  assert.equal(otherOrg.status, 404);
  assert.equal((await call("/api/members?orgId=3", { cookie: ravi })).status, 404);
});

test("content follows audience and entitlements", async () => {
  const sara = await login(SARA);
  const saraContent = (await call("/api/content", { cookie: sara })).data;
  assert.ok(!saraContent.some((c) => c.audience === "employee"), "no employee-only content for clients");
  assert.ok(!saraContent.some((c) => c.product === "riva" && c.audience === "client"), "Meridian isn't entitled to RIVA");
  const dev = await login(DEV);
  assert.ok(!(await call("/api/content", { cookie: dev })).data.some((c) => c.audience === "client"));
});

test("the shared feed carries no tenant, author or moderator data", async () => {
  const sara = await login(SARA);
  const feed = (await call("/api/shared", { cookie: sara })).data;
  assert.ok(feed.length >= 5);
  for (const item of feed) {
    for (const key of ["org_id", "author_id", "author", "moderator_note", "observation_id", "email"]) assert.ok(!(key in item), key);
  }
  // Attribution only where the author opted in (seed: only Kestrel did).
  assert.ok(feed.filter((i) => i.attribution).every((i) => i.attribution === "Kestrel Finance"));
});

test("workspace switch only to memberships you hold, and one tenant at a time", async () => {
  const maya = await login(MAYA);
  const me = (await call("/api/me", { cookie: maya })).data;
  assert.equal(me.memberships.length, 2);
  assert.equal((await call("/api/me/workspace", { cookie: maya, method: "POST", body: { membershipId: 1 } })).status, 404);
  const other = me.memberships.find((m) => m.id !== me.active);
  assert.equal((await call("/api/me/workspace", { cookie: maya, method: "POST", body: { membershipId: other.id } })).status, 200);
  assert.equal((await call("/api/me", { cookie: maya })).data.org, other.org);
});

test("themes below three organisations are suppressed for clients, visible to moderators", async () => {
  const sara = await login(SARA);
  const omar = await login(OMAR);
  const forClient = (await call("/api/themes", { cookie: sara })).data;
  const small = forClient.find((t) => t.name === "New-to-credit evidence");
  assert.equal(small.suppressed, true);
  assert.equal(small.orgs, null);
  assert.deepEqual(small.evidence, []);
  assert.equal(forClient.find((t) => t.name === "Seasonality context").orgs, 3);
  assert.equal((await call("/api/themes", { cookie: omar })).data.find((t) => t.name === "New-to-credit evidence").orgs, 2);
  const priya = await login(PRIYA);
  assert.equal((await call(`/api/themes/${small.id}/synthesize`, { cookie: priya, method: "POST" })).status, 409);
});

test("governed flow: submit → sensitive copy refused → redacted copy published → withdraw removes it at once", async () => {
  const chen = await login(CHEN);
  const omar = await login(OMAR);
  const created = await call("/api/observations", { cookie: chen, method: "POST", body: {
    title: "Test: borrowers ask for weekly repayment schedules", body: "Several borrowers asked for weekly instalments. Call 9876543210 for details.",
    category: "Improvement suggestion", offering: "sme-credit-decisioning", period: "Q4 2026", evidence_type: "Borrower calls",
    confidence: "Medium", visibility: "private" } });
  assert.equal(created.status, 200);
  const id = created.data.id;
  const sara = await login(SARA);
  assert.equal((await call(`/api/observations/${id}`, { cookie: sara })).status, 404);
  assert.equal((await call(`/api/observations/${id}/submit`, { cookie: chen, method: "POST", body: { publish: false } })).status, 422);
  assert.equal((await call(`/api/observations/${id}/submit`, { cookie: chen, method: "POST", body: { publish: true } })).status, 200);
  const blocked = await call(`/api/moderation/${id}`, { cookie: omar, method: "POST", body: { decision: "publish" } });
  assert.equal(blocked.status, 422);
  assert.match(blocked.data.detail, /Redact/);
  const ok = await call(`/api/moderation/${id}`, { cookie: omar, method: "POST",
    body: { decision: "publish", body: "Several borrowers asked for weekly instalments." } });
  assert.equal(ok.status, 200, JSON.stringify(ok.data));
  const inFeed = async () => (await call("/api/shared?q=weekly%20instalments", { cookie: sara })).data.length;
  assert.equal(await inFeed(), 1);
  assert.equal((await call(`/api/observations/${id}/withdraw`, { cookie: chen, method: "POST" })).status, 200);
  assert.equal(await inFeed(), 0);
});

test("revoking a membership takes effect on the next request", async () => {
  const ravi = await login(RAVI);
  const email = `new.${Date.now()}@meridianbank.example`;
  assert.equal((await call("/api/members", { cookie: ravi, method: "POST", body: { email, role: "client_member" } })).status, 200);
  const invite = (await call("/api/dev/outbox")).data.find((m) => m.to_email === email);
  const token = invite.body.match(/\/invite\/([\w-]+)/)[1];
  const wrong = await login(SARA);
  assert.equal((await call(`/api/invitations/${token}`, { cookie: wrong, method: "POST" })).status, 403, "only the invited email");
  const newbie = await login(email);
  assert.equal((await call(`/api/invitations/${token}`, { cookie: newbie, method: "POST" })).status, 200);
  assert.equal((await call(`/api/invitations/${token}`, { cookie: newbie, method: "POST" })).status, 410, "single use");
  // Sessions start without a workspace for a just-invited user until they pick one; pick it.
  const me = (await call("/api/me", { cookie: newbie })).data;
  await call("/api/me/workspace", { cookie: newbie, method: "POST", body: { membershipId: me.memberships[0].id } });
  assert.equal((await call("/api/shared", { cookie: newbie })).status, 200);
  const members = (await call("/api/members", { cookie: ravi })).data.members;
  const m = members.find((x) => x.email === email);
  assert.equal((await call(`/api/members/${m.id}`, { cookie: ravi, method: "DELETE" })).status, 200);
  assert.equal((await call("/api/shared", { cookie: newbie })).status, 403);
});

test("cross-site writes are refused", async () => {
  const sara = await login(SARA);
  const r = await call("/api/observations", { cookie: sara, method: "POST", origin: "https://evil.example", body: {} });
  assert.equal(r.status, 403);
});
