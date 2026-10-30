// Fifteen common attacks against a running azentio.ai, in plain words, with what the server did about each.
// Every attack is either a read or a write the server refuses, so it's safe against the live site.
// Usage: npm run attack                       (the live site)
//        npm run attack -- http://localhost:3000
// Needs demo mode (sign-in codes are read from the demo outbox), as on the live site and in local development.

const BASE = (process.argv[2] ?? "https://azentio-platform.vercel.app").replace(/\/$/, "");
const results = [];

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

async function signIn(email) {
  await call("/api/auth/code", { method: "POST", body: { email } });
  const mail = (await call("/api/dev/outbox")).data.find((m) => m.to_email === email && m.subject.includes("sign-in"));
  const code = mail.body.match(/\b(\d{6})\b/)[1];
  const r = await call("/api/auth/verify", { method: "POST", body: { email, code } });
  return r.res.headers.get("set-cookie").split(";")[0];
}

function report(name, attack, blocked, outcome) {
  results.push(blocked);
  console.log(`${blocked ? "BLOCKED" : "NOT BLOCKED"}  ${name}\n         attack: ${attack}\n         result: ${outcome}\n`);
}

console.log(`Attacking ${BASE}\n`);
const sara = await signIn("sara@meridianbank.example"); // Meridian Bank, client member
const ravi = await signIn("ravi@meridianbank.example"); // Meridian Bank, client admin
const chen = await signIn("chen@kestrelfinance.example"); // Kestrel Finance, a competitor
const arjun = await signIn("admin@azentio.com"); // Azentio portal admin

// 1. Data grab without signing in
const anon = await Promise.all(["/api/observations", "/api/shared", "/api/admin/audit"].map((p) => call(p)));
report("Signed-out data grab", "call the private API with no session", anon.every((r) => r.status === 401),
  anon.map((r) => r.status).join(", ") + " (401 = sign in first)");

// 2. IDOR across banks
const saraNotes = (await call("/api/observations", { cookie: sara })).data;
const target = saraNotes[0];
const idor = await call(`/api/observations/${target.id}`, { cookie: chen });
report("IDOR across banks", `Chen (Kestrel) requests Meridian's observation #${target.id} by id`, idor.status === 404,
  `${idor.status}: as if it didn't exist, so ids can't even be probed`);

// 3. Snooping on a colleague's private draft
const draft = saraNotes.find((o) => o.visibility === "private");
if (draft) {
  const snoop = await call(`/api/observations/${draft.id}`, { cookie: ravi });
  report("Colleague reads a private draft", `Ravi (same bank) opens Sara's private draft #${draft.id}`, snoop.status === 404, `${snoop.status}`);
}

// 4. Privilege escalation
const esc = await call("/api/members", { cookie: ravi, method: "POST", body: { email: "mallory@meridianbank.example", role: "portal_admin" } });
report("Privilege escalation", "a bank's admin tries to hand out Azentio's portal-admin role", esc.status === 403, `${esc.status}: ${esc.data.detail}`);

// 5. Admin overreach
const over = await call("/api/observations", { cookie: arjun });
report("Admin reads banks' notes", "Azentio's portal admin lists client observations", over.status === 403, `${over.status}: admins get no access to client notes`);

// 6. Client opens the moderation queue
const mod = await call("/api/moderation", { cookie: sara });
report("Client opens moderation", "a bank user calls the moderation API", mod.status === 403, `${mod.status}`);

// 7. CSRF
const csrf = await call("/api/observations", { cookie: sara, method: "POST", origin: "https://evil.example",
  body: { title: "Forged", body: "Posted from another site.", category: "Market observation", offering: "riva", period: "2026", evidence_type: "x", confidence: "Low" } });
report("Cross-site request forgery", "another website posts with Sara's cookie", csrf.status === 403, `${csrf.status}: ${csrf.data.detail}`);

// 8. SQL injection
const sqli = await call(`/api/shared?q=${encodeURIComponent("' OR '1'='1")}`, { cookie: sara });
const sqliId = await call("/api/observations/1%20OR%201%3D1", { cookie: sara });
report("SQL injection", "search for ' OR '1'='1 and request observation \"1 OR 1=1\"", sqli.data.length === 0 && sqliId.status === 404,
  `search matched ${sqli.data.length} items (searched as text), id answered ${sqliId.status}`);

// 9. Brute-forcing a sign-in code
const victim = `bruteforce.${Date.now().toString(36)}@test.example`;
await call("/api/auth/code", { method: "POST", body: { email: victim } });
const guesses = [];
for (let i = 0; i < 8; i++) guesses.push((await call("/api/auth/verify", { method: "POST", body: { email: victim, code: String(100000 + i) } })).status);
const checked = guesses.filter((s) => s === 400).length;
report("Brute-forcing a sign-in code", "eight wrong six-digit codes in a row", checked <= 5 && guesses.at(-1) === 429,
  `${checked} guesses checked, then ${guesses.at(-1)} (locked: ask for a new code)`);

// 10. Account enumeration
const known = await call("/api/auth/code", { method: "POST", body: { email: "omar@azentio.com" } });
const stranger = await call("/api/auth/code", { method: "POST", body: { email: `stranger.${Date.now().toString(36)}@test.example` } });
report("Account enumeration", "compare the sign-in answer for a real account and a stranger",
  known.status === stranger.status && JSON.stringify(known.data) === JSON.stringify(stranger.data), "identical answers");

// 11. Data leakage in the shared feed
const feed = (await call("/api/shared", { cookie: chen })).data;
const leaked = feed.flatMap((s) => Object.keys(s)).filter((k) => /org_id|tenant|author|note|email/i.test(k));
report("Data leakage", "look for tenant, author or note fields in what other banks receive", leaked.length === 0,
  leaked.length ? `leaked: ${[...new Set(leaked)]}` : `${feed.length} shared copies, none carry them`);

// 12. Singling out a small group
const themes = (await call("/api/themes", { cookie: chen })).data;
const small = themes.filter((t) => t.suppressed);
report("Singling out a small group", "read a theme that fewer than three banks contributed to",
  small.length > 0 && small.every((t) => t.evidence.length === 0 && t.orgs === null), `${small.length} theme(s) below threshold, shown with no evidence or counts`);

// 13. Script injection and clickjacking
const page = (await call("/")).res.headers;
const csp = page.get("content-security-policy") ?? "";
const scriptSrc = csp.split(";").find((d) => d.trim().startsWith("script-src")) ?? "";
report("Script injection and clickjacking", "check the browser rules every page is sent with",
  /'nonce-/.test(scriptSrc) && !scriptSrc.includes("'unsafe-inline'") && page.get("x-frame-options") === "DENY",
  "only scripts carrying this request's nonce run, and no site can frame the page");

// 14. Malformed input
const junk = await call("/api/requests", { method: "POST", body: { kind: "demo", name: 123, email: ["x"], company: { a: 1 } } });
report("Malformed input", "send numbers, arrays and objects where text is expected", junk.status >= 400 && junk.status < 500, `${junk.status}, never a crash (500)`);

// 15. Forged session
const forged = await call("/api/observations", { cookie: "__Host-azp_session=forged; azp_session=forged" });
report("Forged session cookie", "invent a session id", forged.status === 401, `${forged.status}: treated as signed out`);

const blocked = results.filter(Boolean).length;
console.log(`${blocked} of ${results.length} attacks blocked.`);
process.exitCode = blocked === results.length ? 0 : 1;
