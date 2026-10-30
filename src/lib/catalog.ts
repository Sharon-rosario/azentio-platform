/**
 * What each product and solution does, for the public pages. Descriptive copy only: no customer names, figures or
 * claims beyond the product summaries. Keyed by the catalogue slug used in `content.slug`.
 */

export type ProductDetail = { audience: string; capabilities: string[] };

export const PRODUCT_DETAIL: Record<string, ProductDetail> = {
  "credit-strategy-simulator": {
    audience: "Credit risk and policy teams deciding where to set cut-offs and rules.",
    capabilities: [
      "Change cut-offs, rules and score bands in a sandbox, away from live decisions",
      "Compare approval rates and expected loss against the current policy",
      "Run each scenario on a historical or synthetic portfolio before anything goes live",
      "Keep a record of every scenario, its assumptions and who signed it off",
    ],
  },
  "sme-credit-decisioning": {
    audience: "SME credit analysts and approvers who need decisions they can explain.",
    capabilities: [
      "Spread financial statements and compute the key ratios in one place",
      "Check each application against policy, with the rule shown for every outcome",
      "Keep documents and evidence beside each recommendation",
      "Record the analyst's decision and reasons in an audit trail",
    ],
  },
  "similar-portfolio-intelligence": {
    audience: "Underwriters and portfolio managers looking for precedent.",
    capabilities: [
      "Find historical segments that resemble a new application",
      "See how comparable loans went on to perform",
      "Surface the indicators that set an application apart from its peers",
      "Explain each match in plain terms, not just a similarity score",
    ],
  },
  riva: {
    audience: "Regulatory reporting and finance teams filing on a schedule.",
    capabilities: [
      "Connect core banking and ledger data sources",
      "Map fields to each version of a regulatory template",
      "Validate before filing, with every error traced back to its source",
      "Version every filing and every mapping change",
    ],
  },
};

export type SolutionDetail = { how: string[]; products: string[] };

export const SOLUTION_DETAIL: Record<string, SolutionDetail> = {
  "intelligent-decisioning": {
    how: [
      "Policy rules and models run side by side, and each outcome names the rule behind it",
      "Evidence and documents sit next to the recommendation an analyst signs",
      "Policy changes are simulated on a portfolio before they reach live decisions",
    ],
    products: ["sme-credit-decisioning", "credit-strategy-simulator", "similar-portfolio-intelligence"],
  },
  "document-intelligence": {
    how: [
      "Statements, payslips and filings are read into structured fields",
      "Every extracted value links back to where it was found, so a reviewer can check it",
      "Low-confidence fields are routed to a person instead of being guessed",
    ],
    products: ["sme-credit-decisioning", "riva"],
  },
  "trusted-enterprise-ai": {
    how: [
      "Access is decided on the server for every request, by role, organisation and entitlement",
      "AI answers only from approved material, and every quote is checked against its source",
      "Every state change is audited, and data stays where it belongs",
    ],
    products: ["sme-credit-decisioning", "riva", "credit-strategy-simulator"],
  },
};
