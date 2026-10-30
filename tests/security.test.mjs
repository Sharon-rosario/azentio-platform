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

test("malformed input is refused with 4xx on every write route, never a 500", async () => {
  // Wrong JSON shapes, and likely field names carrying the wrong types. Path ids are absent or non-numeric, so
  // nothing seeded can change. Logout is skipped: it takes no body and would end the session.
  const ROUTES = [
    ["POST", "/api/auth/code"], ["POST", "/api/auth/verify"], ["POST", "/api/requests"],
    ["POST", "/api/content"], ["POST", "/api/ideas"], ["PATCH", "/api/ideas/:id"],
    ["POST", "/api/invitations/:id"], ["POST", "/api/me/workspace"], ["POST", "/api/members"],
    ["DELETE", "/api/members/:id"], ["POST", "/api/moderation/:id"], ["POST", "/api/observations"],
    ["PATCH", "/api/observations/:id"], ["POST", "/api/observations/:id/submit"],
    ["POST", "/api/observations/:id/withdraw"], ["POST", "/api/reports/:id"],
    ["POST", "/api/shared/:id/report"], ["POST", "/api/themes/:id/synthesize"],
  ];
  const wrong = { email: 123, code: [], title: {}, body: 12, summary: [], status: [], role: 7, membershipId: "abc",
    decision: {}, reason: 99, consents: "yes", visibility: 3, offering: [], category: {}, kind: 5, audience: [] };
  const BODIES = ["null", "[]", '"text"', "42", "{}", JSON.stringify(wrong), "{not json"];
  const people = [null, SARA, RAVI, OMAR, PRIYA, "lena@azentio.com", ADMIN];
  const cookies = await Promise.all(people.map((e) => (e ? login(e) : null)));
  const failures = [];
  for (const [method, pattern] of ROUTES) {
    for (const id of pattern.includes(":id") ? ["999999", "abc"] : [""]) {
      const path = pattern.replace(":id", id);
      for (const cookie of cookies) {
        for (const raw of BODIES) {
          const headers = { "content-type": "application/json", ...(cookie ? { cookie } : {}) };
          const res = await fetch(BASE + path, { method, headers, body: raw });
          if (res.status >= 500) failures.push(`${method} ${path} ${raw.slice(0, 30)} -> ${res.status}`);
        }
      }
    }
  }
  assert.deepEqual(failures, []);
});

// A published contribution by Chen, used by the report/withdraw/edit tests below. Returns ids and a feed lookup.
async function publishedByChen(title) {
  const chen = await login(CHEN);
  const omar = await login(OMAR);
  const created = await call("/api/observations", { cookie: chen, method: "POST", body: {
    title, body: `${title}: seen across several branch portfolios this quarter.`, category: "Market observation",
    offering: "sme-credit-decisioning", period: "Q4 2026", evidence_type: "Portfolio review", confidence: "Medium" } });
  const id = created.data.id;
  assert.equal((await call(`/api/observations/${id}/submit`, { cookie: chen, method: "POST", body: { publish: true } })).status, 200);
  assert.equal((await call(`/api/moderation/${id}`, { cookie: omar, method: "POST", body: { decision: "publish" } })).status, 200);
  const sara = await login(SARA);
  const feed = async () => (await call(`/api/shared?q=${encodeURIComponent(title)}`, { cookie: sara })).data;
  return { id, chen, omar, sara, feed };
}

test("a withdrawn copy can't be republished by restoring an open report on it", async () => {
  const { id, chen, omar, sara, feed } = await publishedByChen(`Withdraw-report ${Date.now().toString(36)}`);
  const [copy] = await feed();
  assert.equal((await call(`/api/shared/${copy.id}/report`, { cookie: sara, method: "POST", body: { reason: "Looks identifying" } })).status, 200);
  const reportId = (await call("/api/moderation", { cookie: omar })).data.reports.find((r) => r.shared_id === copy.id).id;
  assert.equal((await call(`/api/observations/${id}/withdraw`, { cookie: chen, method: "POST" })).status, 200);
  const restore = await call(`/api/reports/${reportId}`, { cookie: omar, method: "POST", body: { decision: "restore", note: "fine" } });
  assert.notEqual(restore.status, 200, "restoring must not succeed after withdrawal");
  assert.equal((await feed()).length, 0, "the withdrawn copy stays out of the feed");
});

test("publishing a new version retires a reported old one, so only one copy can ever be live", async () => {
  const { id, chen, omar, sara, feed } = await publishedByChen(`Supersede-report ${Date.now().toString(36)}`);
  const [v1] = await feed();
  assert.equal((await call(`/api/shared/${v1.id}/report`, { cookie: sara, method: "POST", body: { reason: "Needs another look" } })).status, 200);
  const reportId = (await call("/api/moderation", { cookie: omar })).data.reports.find((r) => r.shared_id === v1.id).id;
  assert.equal((await call(`/api/observations/${id}`, { cookie: chen, method: "PATCH", body: { body: "Updated wording after review." } })).status, 200);
  assert.equal((await call(`/api/moderation/${id}`, { cookie: omar, method: "POST", body: { decision: "publish" } })).status, 200);
  const restore = await call(`/api/reports/${reportId}`, { cookie: omar, method: "POST", body: { decision: "restore", note: "fine" } });
  assert.notEqual(restore.status, 200, "the superseded version can't come back");
  const live = await feed();
  assert.equal(live.length, 1, "exactly one live copy");
  assert.equal(live[0].version, 2);
});

test("visibility can't be changed around the review: community only via submit, and kept until withdrawal", async () => {
  const { id, chen } = await publishedByChen(`Visibility-edit ${Date.now().toString(36)}`);
  const edit = await call(`/api/observations/${id}`, { cookie: chen, method: "PATCH", body: { visibility: "private", body: "Edited." } });
  assert.equal(edit.status, 200);
  assert.equal((await call(`/api/observations/${id}`, { cookie: chen })).data.visibility, "community", "editing can't silently leave review");
  const draft = await call("/api/observations", { cookie: chen, method: "POST", body: {
    title: "Draft visibility probe", body: "A private note.", category: "Market observation", offering: "riva", period: "Q4 2026",
    evidence_type: "Internal note", confidence: "Low", visibility: "community" } });
  assert.equal(draft.status, 422, "community visibility can't be set without submit and consent");
});

test("an employee without a publishing grant can't publish content", async () => {
  const dev = await login(DEV);
  const r = await call("/api/content", { cookie: dev, method: "POST", body: {
    kind: "insight", title: "Unapproved post", summary: "Should be refused.", audience: "public" } });
  assert.equal(r.status, 403);
});

test("the playground is for employees: a client gets the refusal, not the tool", async () => {
  const sara = await login(SARA);
  const html = (await call("/portal/playground", { cookie: sara })).data;
  assert.match(html, /The playground is for Azentio employees/);
  assert.doesNotMatch(html, /Simulated output|Run<\/button>/);
});

test("a sign-in code for a real mailbox is never shown, even in demo mode", async () => {
  // Demo mode displays codes only for the seeded personas and the reserved .example domain; anything else, such as a
  // new @azentio.com address, gets a code by (simulated) email that no screen or API reveals.
  const email = `new.hire.${Date.now().toString(36)}@azentio.com`;
  assert.equal((await call("/api/auth/code", { method: "POST", body: { email } })).status, 200);
  const outbox = (await call("/api/dev/outbox")).data;
  assert.equal(outbox.some((m) => m.to_email === email), false);
});

test("clients see an idea's status and public note, never its internal fields", async () => {
  const ideas = (await call("/api/ideas", { cookie: await login(SARA) })).data;
  assert.ok(ideas.length > 0);
  for (const i of ideas) {
    for (const k of ["problem", "proposed_outcome", "priority", "created_by"]) assert.equal(k in i, false, `${k} leaked`);
  }
  const internal = (await call("/api/ideas", { cookie: await login(PRIYA) })).data;
  assert.ok("problem" in internal[0], "employees still see the internal fields");
});

test("AIRA's input is published shared copies only: theme evidence has no tenant or author data", async () => {
  const omar = await login(OMAR);
  const published = new Set((await call("/api/shared", { cookie: await login(SARA) })).data.map((s) => s.id));
  const themes = (await call("/api/themes", { cookie: omar })).data;
  const evidence = themes.flatMap((t) => t.evidence ?? []);
  assert.ok(evidence.length > 0);
  for (const e of evidence) {
    assert.ok(published.has(e.id), `evidence ${e.id} is a published shared copy`);
    for (const k of ["org_id", "author_id", "author", "moderator_note", "observation_id", "email"]) assert.equal(k in e, false, `${k} in evidence`);
  }
});

test("the public request form is rate limited per source", async () => {
  // At most 5 stored requests per source in 15 minutes. Holds whether or not earlier runs used the window.
  const statuses = [];
  for (let i = 0; i < 7; i++) {
    const r = await call("/api/requests", { method: "POST", body: {
      kind: "demo", name: "Rate Probe", email: `rate.${Date.now().toString(36)}.${i}@probe.example`, message: "probe" } });
    statuses.push(r.status);
    if (r.status === 429) break;
  }
  assert.ok(statuses.includes(429), `expected a 429, got ${statuses}`);
  assert.ok(statuses.filter((s) => s === 200).length <= 5);
  assert.ok(statuses.every((s) => s === 200 || s === 429), String(statuses));
});

test("public request fields with the wrong types are refused, never a 500", async () => {
  for (const body of [{ kind: "demo", name: 123, email: "a@b.example" }, { kind: "hackathon", name: "Ok Name", email: ["x"] },
    { kind: "demo", name: "Ok Name", email: "a@b.example", company: { x: 1 }, message: 42 }]) {
    const r = await call("/api/requests", { method: "POST", body });
    assert.ok(r.status >= 400 && r.status < 500, `${JSON.stringify(body)} -> ${r.status}`);
  }
});

test("a de-identified copy names no exact industry, and a filter can't single out one organisation", async () => {
  const { sara, feed } = await publishedByChen(`Industry-general ${Date.now().toString(36)}`);
  const [copy] = await feed();
  assert.equal(copy.attribution, null);
  assert.equal(copy.industry, "Financial services", "an exact industry can point at the contributor");
  const all = (await call("/api/shared", { cookie: sara })).data.length;
  const narrowed = (await call("/api/shared?industry=Non-bank%20lender", { cookie: sara })).data.length;
  assert.equal(narrowed, all, "a filter value from a single organisation is not applied");
});

test("moderation and report fields with the wrong types are refused on real records, never a 500", async () => {
  const chen = await login(CHEN);
  const omar = await login(OMAR);
  const created = await call("/api/observations", { cookie: chen, method: "POST", body: {
    title: "Typing probe", body: "A short probe.", category: "Market observation", offering: "riva", period: "Q4 2026",
    evidence_type: "Probe", confidence: "Low" } });
  const id = created.data.id;
  assert.equal((await call(`/api/observations/${id}/submit`, { cookie: chen, method: "POST", body: { publish: true } })).status, 200);
  for (const body of [{ decision: "return", note: 123 }, { decision: "publish", title: 5 }, { decision: "publish", industry: ["x"] },
    { decision: "publish", theme_id: "abc" }]) {
    const r = await call(`/api/moderation/${id}`, { cookie: omar, method: "POST", body });
    assert.ok(r.status >= 400 && r.status < 500, `${JSON.stringify(body)} -> ${r.status}`);
  }
  const shared = (await call("/api/shared", { cookie: await login(SARA) })).data[0];
  const r = await call(`/api/shared/${shared.id}/report`, { cookie: await login(SARA), method: "POST", body: { reason: ["x"] } });
  assert.ok(r.status >= 400 && r.status < 500, `report -> ${r.status}`);
});

test("pages get a nonce-based script policy, fresh per request, and the API allows nothing to run", async () => {
  const csp = async (path) => (await fetch(BASE + path)).headers.get("content-security-policy") ?? "";
  const [a, b] = [await csp("/"), await csp("/")];
  const script = a.split(";").find((d) => d.trim().startsWith("script-src")) ?? "";
  assert.match(script, /'nonce-[A-Za-z0-9+/=]+'/);
  assert.match(script, /'strict-dynamic'/);
  assert.doesNotMatch(script, /'unsafe-inline'/, "no inline scripts without the nonce");
  assert.notEqual(a.match(/'nonce-([^']+)'/)[1], b.match(/'nonce-([^']+)'/)[1], "a new nonce on every request");
  assert.match(a, /frame-ancestors 'none'/);
  assert.match(await csp("/api/content"), /default-src 'none'/);
});

// Runs last: after every test above has written audit rows, the whole chain must still verify end to end.
test("an identifier in any published field blocks publication, not just in the title and text", async () => {
  const chen = await login(CHEN);
  const omar = await login(OMAR);
  const created = await call("/api/observations", { cookie: chen, method: "POST", body: {
    title: `Evidence-field probe ${Date.now().toString(36)}`, body: "Collections dip each monsoon across the book.",
    category: "Market observation", offering: "sme-credit-decisioning", period: "Q4 2026",
    evidence_type: "Ask rbi.desk@kestrelfinance.example", confidence: "Medium" } });
  const id = created.data.id;
  assert.equal((await call(`/api/observations/${id}/submit`, { cookie: chen, method: "POST", body: { publish: true } })).status, 200);
  const r = await call(`/api/moderation/${id}`, { cookie: omar, method: "POST", body: { decision: "publish" } });
  assert.equal(r.status, 422, JSON.stringify(r.data));
  assert.match(r.data.detail, /email address/);
  const free = await call("/api/observations", { cookie: chen, method: "POST", body: { title: "Free-text offering", body: "x".repeat(20),
    category: "Market observation", offering: "a@b.example", period: "Q4 2026", evidence_type: "Review", confidence: "Medium" } });
  assert.equal(free.status, 422, "the offering is one of the products, never free text");
});

test("consent to publish must be an explicit yes: a string like \"false\" is refused", async () => {
  const sara = await login(SARA);
  const created = await call("/api/observations", { cookie: sara, method: "POST", body: { title: `Consent probe ${Date.now().toString(36)}`,
    body: "A pattern worth sharing with the community.", category: "Market observation", offering: "riva", period: "Q4 2026",
    evidence_type: "Review", confidence: "Low" } });
  const r = await call(`/api/observations/${created.data.id}/submit`, { cookie: sara, method: "POST", body: { publish: "false" } });
  assert.equal(r.status, 422);
});

test("parallel wrong guesses can't get past the five-attempt limit on a sign-in code", async () => {
  const email = `burst.${Date.now().toString(36)}@test.example`;
  await call("/api/auth/code", { method: "POST", body: { email } });
  const guesses = await Promise.all(Array.from({ length: 12 }, (_, i) =>
    call("/api/auth/verify", { method: "POST", body: { email, code: String(100000 + i) } })));
  const tried = guesses.filter((g) => g.status === 400).length;
  assert.ok(tried <= 5, `${tried} guesses were checked; the limit is 5`);
  assert.ok(guesses.every((g) => g.status === 400 || g.status === 429), guesses.map((g) => g.status).join(","));
});

test("a null origin, wrong-typed idea and content fields and a malformed portal id answer 4xx, never a 500", async () => {
  const origin = await call("/api/auth/code", { method: "POST", origin: "null", body: { email: "x@test.example" } });
  assert.equal(origin.status, 403);
  const priya = await login(PRIYA);
  for (const body of [{ title: 5, problem: "p", proposed_outcome: "o", owner: "x", theme_id: 1 },
    { title: "t", problem: ["p"], proposed_outcome: "o", owner: "x", theme_id: 1, priority: 3 }]) {
    const r = await call("/api/ideas", { cookie: priya, method: "POST", body });
    assert.ok(r.status >= 400 && r.status < 500, `idea ${JSON.stringify(body)} -> ${r.status}`);
  }
  const ideas = (await call("/api/ideas", { cookie: priya })).data;
  const patch = await call(`/api/ideas/${ideas[0].id}`, { cookie: priya, method: "PATCH", body: { status: "Planned", public_note: 7 } });
  assert.equal(patch.status, 422);
  const lena = await login("lena@azentio.com");
  for (const body of [{ kind: "insight", audience: "public", title: 9, summary: "s" },
    { kind: "insight", audience: "public", title: "t", summary: "s", product: { x: 1 } }]) {
    const r = await call("/api/content", { cookie: lena, method: "POST", body });
    assert.ok(r.status >= 400 && r.status < 500, `content ${JSON.stringify(body)} -> ${r.status}`);
  }
  for (const path of ["/portal/observations/abc", "/portal/observations/1e3", "/portal/moderation/abc"]) {
    assert.equal((await call(path, { cookie: await login(SARA) })).status, 404, path);
  }
});

test("the audit log's hash chain verifies end to end after every write in this suite", async () => {
  const html = (await call("/portal/admin", { cookie: await login(ADMIN) })).data;
  assert.match(html, /Hash chain intact: all \d+ entries verified/);
});
