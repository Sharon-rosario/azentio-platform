type Exec = (sql: string, params: unknown[]) => Promise<Record<string, unknown>[]>;

// Synthetic data only (the brief: "Use synthetic data throughout"). Three fictional client organisations, so the
// shared-learning threshold (3 distinct organisations) can be shown both met and not met.

const at = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

export const PRODUCTS = [
  { slug: "credit-strategy-simulator", title: "Credit Strategy Simulator",
    summary: "Simulates credit policy changes before deployment and shows the likely effect on approvals, risk exposure and portfolio outcomes." },
  { slug: "sme-credit-decisioning", title: "SME Credit Decisioning Workbench",
    summary: "Financial analysis, policy evaluation, risk review and credit recommendations in one workbench, with evidence and human oversight." },
  { slug: "similar-portfolio-intelligence", title: "Similar Portfolio Intelligence",
    summary: "Compares financing applications with historical portfolio segments to surface patterns, risk indicators and comparable outcomes." },
  { slug: "riva", title: "RIVA",
    summary: "A configurable reporting environment: connect data sources, map report fields, validate and file with less manual work." },
];

const ORGS: [string, string, "internal" | "client", string, string][] = [
  ["azentio", "Azentio", "internal", "Software", "Global"],
  ["meridian", "Meridian Bank", "client", "Banking", "Middle East"],
  ["kestrel", "Kestrel Finance", "client", "Non-bank lender", "India"],
  ["harbourline", "Harbourline Credit Union", "client", "Credit union", "Southeast Asia"],
];

// [email, name, [org slug, roles][]]
const USERS: [string, string, [string, string][]][] = [
  ["priya@azentio.com", "Priya Nair", [["azentio", "employee,product_owner"]]],
  ["omar@azentio.com", "Omar Haddad", [["azentio", "employee,moderator"]]],
  ["lena@azentio.com", "Lena Fischer", [["azentio", "employee,publisher"]]],
  ["admin@azentio.com", "Arjun Rao", [["azentio", "employee,portal_admin"]]],
  ["dev@azentio.com", "Kavya Menon", [["azentio", "employee"]]],
  ["ravi@meridianbank.example", "Ravi Shankar", [["meridian", "client_admin"]]],
  ["sara@meridianbank.example", "Sara Al-Amin", [["meridian", "client_member"]]],
  ["anil@kestrelfinance.example", "Anil Kapoor", [["kestrel", "client_admin"]]],
  ["chen@kestrelfinance.example", "Chen Wei", [["kestrel", "client_member"]]],
  ["amina@harbourline.example", "Amina Yusof", [["harbourline", "client_admin"]]],
  // An adviser who works with two clients: needs the workspace switcher, and must never see across them at once.
  ["maya@advisory.example", "Maya Iyer", [["kestrel", "client_member"], ["harbourline", "client_member"]]],
];

/** Seeded synthetic accounts: the only addresses whose sign-in codes the demo outbox may show. */
export const DEMO_PERSONAS = new Set(USERS.map(([email]) => email));

const ENTITLEMENTS: [string, string][] = [
  ["meridian", "sme-credit-decisioning"], ["meridian", "credit-strategy-simulator"],
  ["kestrel", "similar-portfolio-intelligence"], ["kestrel", "riva"],
  ["harbourline", "sme-credit-decisioning"],
];

// [org, author email, title, body, category, offering, period, evidence, confidence, visibility, status, theme]
type Obs = [string, string, string, string, string, string, string, string, string, string, string, number | null];
const OBSERVATIONS: Obs[] = [
  ["meridian", "sara@meridianbank.example", "Seasonal SME revenue dips read as distress",
    "Retail and agri SMEs show 30-40% revenue dips in the off-season every year. Our scorecards treat a single low quarter as deterioration, so seasonal businesses get declined or repriced even when the annual picture is stable.",
    "Product gap", "sme-credit-decisioning", "Q1-Q3 2026", "Portfolio review", "High", "community", "published", 1],
  ["kestrel", "chen@kestrelfinance.example", "Monsoon months distort cash-flow ratios",
    "For small manufacturers in our book, June to September collections fall sharply and recover after the festive season. Debt-service ratios computed on trailing three months look alarming in August.",
    "Market observation", "sme-credit-decisioning", "Jun-Sep 2026", "Credit committee cases", "Medium", "community", "published", 1],
  ["harbourline", "amina@harbourline.example", "Members with festive-season income need seasonal context",
    "Several small traders earn most of their income around two festive periods. Underwriters asked for a way to compare a member against the same months last year instead of the last 90 days.",
    "Improvement suggestion", "sme-credit-decisioning", "2025-2026", "Underwriter feedback", "Medium", "community", "published", 1],
  ["meridian", "ravi@meridianbank.example", "Thin-file applicants rejected on missing bureau history",
    "Young businesses with under 12 months of bureau history are declined automatically even when bank statements show steady inflows.",
    "Operational challenge", "credit-strategy-simulator", "2026", "Decline analysis", "Medium", "community", "published", 2],
  ["kestrel", "anil@kestrelfinance.example", "Alternative data for new-to-credit SMEs",
    "GST filings and UPI inflows predicted repayment for new-to-credit borrowers better than the bureau score in a 400-account pilot.",
    "Successful practice", "credit-strategy-simulator", "H1 2026", "Pilot results", "High", "community", "published", 2],
  ["kestrel", "chen@kestrelfinance.example", "Report mapping errors after regulator template change",
    "The new quarterly template moved two fields; our mappings silently produced blanks for one cycle. Contact rbi.desk@kestrelfinance.example or account 004512339871 for the sample.",
    "Product gap", "riva", "Q3 2026", "Filing incident", "High", "community", "submitted", null],
  ["meridian", "sara@meridianbank.example", "Draft: collateral valuation lag",
    "Valuations for commercial property lag market moves by two quarters. Still collecting examples.",
    "Market observation", "sme-credit-decisioning", "2026", "Anecdotal", "Low", "private", "draft", null],
  ["meridian", "ravi@meridianbank.example", "Internal: relationship managers override seasonal declines",
    "RMs override about one in five seasonal declines manually; we want to track whether those loans perform.",
    "Operational challenge", "sme-credit-decisioning", "2026", "Override log", "Medium", "organisation", "draft", null],
  ["harbourline", "amina@harbourline.example", "Faster turnaround for small-ticket loans",
    "Members expect same-day answers for small-ticket loans.", "Improvement suggestion", "sme-credit-decisioning",
    "2026", "Member feedback", "Low", "community", "returned", null],
];

export async function seed(exec: Exec) {
  const ins = async (sql: string, ...a: (string | number | null)[]) => {
    let i = 0;
    const q = sql.replace(/\?/g, () => `$${++i}`);
    const rows = await exec(q.trim().startsWith("insert into entitlements") ? q : `${q} returning id`, a);
    return { lastInsertRowid: Number(rows[0]?.id ?? 0) };
  };
  const orgId: Record<string, number> = {};
  for (const [slug, name, kind, industry, region] of ORGS) {
    orgId[slug] = Number((await ins("insert into organisations (slug,name,kind,industry,region) values (?,?,?,?,?)",
      slug, name, kind, industry, region)).lastInsertRowid);
  }
  const userId: Record<string, number> = {};
  for (const [email, name, memberships] of USERS) {
    userId[email] = Number((await ins("insert into users (email,name,created_at) values (?,?,?)", email, name, at(60))).lastInsertRowid);
    for (const [org, roles] of memberships) {
      await ins("insert into memberships (user_id,org_id,roles,created_at) values (?,?,?,?)", userId[email], orgId[org], roles, at(60));
    }
  }
  for (const [org, product] of ENTITLEMENTS) await ins("insert into entitlements values (?,?)", orgId[org], product);

  // [kind, slug, title, summary, audience, product, starts]
  const content: [string, string | null, string, string, string, string | null, string | null][] = [
    ...PRODUCTS.map((p) => ["product", p.slug, p.title, p.summary, "public", p.slug, null] as [string, string, string, string, string, string, null]),
    ["solution", "intelligent-decisioning", "Intelligent Decisioning", "Credit and risk decisions with evidence, policy checks and human oversight.", "public", null, null],
    ["solution", "document-intelligence", "Document Intelligence", "Statements, payslips and filings read into fields a reviewer can check.", "public", null, null],
    ["solution", "trusted-enterprise-ai", "Trusted Enterprise AI", "Governed AI: access control, audit trails and data that stays where it belongs.", "public", null, null],
    ["insight", "seasonality-in-sme-credit", "Why seasonal SMEs look riskier than they are", "A plain-language note on reading off-season revenue dips.", "public", null, null],
    ["insight", "thin-file-evidence", "When the bureau file is thin, look at the cash", "What GST filings and account inflows can and can't tell you about a new-to-credit borrower.", "public", null, null],
    ["insight", "template-changes", "Regulatory template changes without the scramble", "Why mappings should be versioned with the template, and checked before every filing.", "public", null, null],
    ["insight", "audit-trails-for-ai", "What an audit trail for AI in lending needs", "Inputs, the evidence used, the human decision and who could see what: a short checklist.", "public", null, null],
    ["broadcast", null, "azentio.ai LIVE: building agents customers trust", "Public talk on governed AI in lending.", "public", null, at(-3)],
    ["experiment", null, "Experiment: seasonality-aware ratio explainer", "Prototype that explains a ratio against the same months last year. Internal notes, not a product commitment.", "employee", null, null],
    ["broadcast", null, "Engineering all-hands: Q4 roadmap (internal)", "Employee-only session and recording.", "employee", null, at(-1)],
    ["demo", null, "SME Credit Decisioning: guided demo", "Walk a synthetic SME application through policy checks and a recommendation.", "client", "sme-credit-decisioning", null],
    ["demo", null, "Credit Strategy Simulator: what-if on approval cut-offs", "Move a cut-off and watch approvals and expected loss on a synthetic portfolio.", "client", "credit-strategy-simulator", null],
    ["demo", null, "Similar Portfolio Intelligence: find comparable segments", "Synthetic applications matched to historical segments.", "client", "similar-portfolio-intelligence", null],
    ["demo", null, "RIVA: map a regulatory template", "Map fields of a synthetic template and validate a filing.", "client", "riva", null],
    ["broadcast", null, "Client webinar: SME credit in seasonal markets", "Invitation-only webinar for clients using SME Credit Decisioning.", "client", "sme-credit-decisioning", at(-5)],
    ["broadcast", null, "Office hours: tuning cut-offs in the Credit Strategy Simulator", "Bring a policy question; a product specialist walks through it on synthetic data.", "client", "credit-strategy-simulator", at(-9)],
    ["broadcast", null, "Recording: RIVA and the Q3 regulatory template change", "What changed in the template, and how mappings were validated before filing.", "client", "riva", at(12)],
    ["broadcast", null, "Recording: governed AI in credit decisioning", "Public session on evidence, human oversight and audit trails in lending AI.", "public", null, at(20)],
    ["broadcast", null, "Recording: AIRA evaluation results (internal)", "How AIRA summaries were tested for grounding and quote accuracy.", "employee", null, at(9)],
  ];
  for (const [kind, slug, title, summary, audience, product, starts] of content) {
    await ins("insert into content (kind,slug,title,summary,audience,product,starts_at,created_at) values (?,?,?,?,?,?,?,?)",
      kind, slug, title, summary, audience, product, starts, at(30));
  }

  await ins("insert into themes (name,offering,description) values (?,?,?)", "Seasonality context", "sme-credit-decisioning",
    "Seasonal businesses judged on short windows look like they are deteriorating.");
  await ins("insert into themes (name,offering,description) values (?,?,?)", "New-to-credit evidence", "credit-strategy-simulator",
    "Thin bureau files and what other evidence predicts repayment.");

  const moderator = userId["omar@azentio.com"];
  // Seeded history gets the audit rows the same actions write when done live, so the log matches the data.
  const log = (when: string, email: string, action: string, entity: string, entityId: number, detail: object) =>
    ins("insert into audit (at,actor_id,actor,action,entity,entity_id,detail) values (?,?,?,?,?,?,?)",
      when, userId[email], email, action, entity, String(entityId), JSON.stringify(detail));
  const obsId: number[] = [];
  for (const [i, [org, author, title, body, category, offering, period, evidence, confidence, visibility, status, theme]] of OBSERVATIONS.entries()) {
    const o = ORGS.find((x) => x[0] === org)!;
    const created = at(20 - i);
    const id = Number((await ins(`insert into observations (org_id,author_id,title,body,category,offering,industry,region,period,
      evidence_type,confidence,visibility,status,moderator_note,created_at,updated_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      orgId[org], userId[author], title, body, category, offering, o[3], o[4], period, evidence, confidence, visibility, status,
      status === "returned" ? "Please add what 'small-ticket' means for you and an observation period." : null,
      created, created)).lastInsertRowid);
    obsId.push(id);
    await log(created, author, "observation.create", "observation", id, { visibility: visibility === "community" ? "private" : visibility });
    if (visibility === "community") await log(created, author, "observation.submit", "observation", id, { consents: { publish: true } });
    if (status === "returned") await log(created, "omar@azentio.com", "moderation.return", "observation", id, { note: "needs detail" });
    await ins("insert into consents (observation_id,purpose,granted,actor_id,at) values (?,?,?,?,?)", id, "store", 1, userId[author], created);
    if (visibility === "community") {
      await ins("insert into consents (observation_id,purpose,granted,actor_id,at) values (?,?,?,?,?)", id, "publish", 1, userId[author], created);
      await ins("insert into consents (observation_id,purpose,granted,actor_id,at) values (?,?,?,?,?)", id, "attribute", org === "kestrel" ? 1 : 0, userId[author], created);
      await ins("insert into consents (observation_id,purpose,granted,actor_id,at) values (?,?,?,?,?)", id, "train", 0, userId[author], created);
    }
    if (status === "published") {
      await ins(`insert into shared_versions (observation_id,version,title,body,category,offering,industry,region,period,evidence_type,
        confidence,attribution,theme_id,published_by,published_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        // De-identified copies carry a general industry, as publish() does; the attributed Kestrel copies keep theirs.
        id, 1, title, body, category, offering, org === "kestrel" ? o[3] : "Financial services", o[4], period, evidence, confidence,
        org === "kestrel" ? o[1] : null,
        theme, moderator, at(15 - i));
      await log(at(15 - i), "omar@azentio.com", "moderation.publish", "observation", id, { version: 1, attribution: org === "kestrel" });
    }
  }

  const firstIdea = Number((await ins(`insert into ideas (title,problem,offering,theme_id,proposed_outcome,owner,priority,status,public_note,created_by,created_at,updated_at)
    values (?,?,?,?,?,?,?,?,?,?,?,?)`,
    "Seasonality-aware comparison explanation", "Seasonal SMEs are judged on short windows and look like they are deteriorating.",
    "sme-credit-decisioning", 1, "Explain key ratios against the same period last year, alongside the trailing window.",
    "Decisioning product team", "High", "Under review", "We're reviewing how ratios could be compared with the same season last year.",
    userId["priya@azentio.com"], at(5), at(2))).lastInsertRowid);
  await log(at(5), "priya@azentio.com", "idea.create", "idea", firstIdea, { status: "Proposed" });
  await log(at(2), "priya@azentio.com", "idea.status", "idea", firstIdea, { to: "Under review" });

  // [title, problem, offering, theme, outcome, owner, priority, status, public note, created, updated]
  const IDEAS: [string, string, string, number | null, string, string, string, string, string | null, number, number][] = [
    ["Alternative-data evidence pack for thin files", "New-to-credit applicants are declined for missing bureau history.",
      "credit-strategy-simulator", 2, "Let analysts attach GST and UPI evidence and see its effect on a simulated decision.",
      "Strategy product team", "High", "Planned", "Planned for a coming release: thin-file applications can carry other repayment evidence.", 12, 4],
    ["Template-change alerts for regulatory mappings", "A template change silently broke field mappings for one cycle.",
      "riva", null, "Flag mappings that point at moved or renamed template fields before a filing is generated.",
      "Reporting product team", "High", "In progress", "In progress: mappings are checked against each new template version.", 9, 1],
    ["Festive-period income view for member lending", "Members with festive-season income are judged on the wrong months.",
      "sme-credit-decisioning", 1, "Show income for the same festive period last year beside the trailing window.",
      "Decisioning product team", "Medium", "Proposed", null, 3, 3],
    ["Policy rule shown with every decline reason", "Analysts couldn't see which rule drove an automated decline.",
      "sme-credit-decisioning", null, "List the policy rule and the evidence behind each decline reason.",
      "Decisioning product team", "Medium", "Released", "Released: every decline reason now names its policy rule and evidence.", 40, 18],
  ];
  for (const [title, problem, offering, theme, outcome, owner, priority, status, note, created, updated] of IDEAS) {
    const ideaId = Number((await ins(`insert into ideas (title,problem,offering,theme_id,proposed_outcome,owner,priority,status,public_note,created_by,created_at,updated_at)
      values (?,?,?,?,?,?,?,?,?,?,?,?)`, title, problem, offering, theme, outcome, owner, priority, status, note,
      userId["priya@azentio.com"], at(created), at(updated))).lastInsertRowid);
    await log(at(created), "priya@azentio.com", "idea.create", "idea", ideaId, { status: "Proposed" });
    if (status !== "Proposed") await log(at(updated), "priya@azentio.com", "idea.status", "idea", ideaId, { to: status });
  }

  // A realistic notification history per persona: [email, text, link, days ago, read]
  const NOTES: [string, string, string, number, boolean][] = [
    ["sara@meridianbank.example", `Your contribution "Seasonal SME revenue dips read as distress" was published to the learning community`, `/portal/observations/${obsId[0]}`, 15, true],
    ["sara@meridianbank.example", `"Seasonality-aware comparison explanation" moved to Under review`, "/portal/ideas", 2, false],
    ["sara@meridianbank.example", "You're invited: Client webinar: SME credit in seasonal markets", "/portal/live", 1, false],
    ["ravi@meridianbank.example", `Your contribution "Thin-file applicants rejected on missing bureau history" was published to the learning community`, `/portal/observations/${obsId[3]}`, 12, true],
    ["ravi@meridianbank.example", `"Alternative-data evidence pack for thin files" is now Planned`, "/portal/ideas", 4, false],
    ["chen@kestrelfinance.example", `Your contribution "Monsoon months distort cash-flow ratios" was published to the learning community`, `/portal/observations/${obsId[1]}`, 14, true],
    ["chen@kestrelfinance.example", `"Template-change alerts for regulatory mappings" is now In progress`, "/portal/ideas", 1, false],
    ["omar@azentio.com", "New contribution to review: Report mapping errors after regulator template change", "/portal/moderation", 5, false],
    ["omar@azentio.com", "Theme \"Seasonality context\" now has contributions from 3 organisations", "/portal/themes", 13, true],
    ["priya@azentio.com", "Theme \"Seasonality context\" is ready: 3 organisations stand behind it", "/portal/themes", 13, true],
    ["priya@azentio.com", "New published evidence for \"New-to-credit evidence\"", "/portal/themes", 15, false],
  ];
  for (const [email, text, link, days, read] of NOTES) {
    await ins("insert into notifications (user_id,text,link,created_at,read_at) values (?,?,?,?,?)", userId[email], text, link, at(days),
      read ? at(days) : null);
  }

  await ins("insert into audit (at,actor_id,actor,action,entity,detail) values (?,?,?,?,?,?)", at(60), null, "system", "seed", "database",
    JSON.stringify({ note: "synthetic data" }));
}
