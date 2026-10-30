// Display names for the product catalogue (seed data in src/server/seed.ts uses the same slugs).
export const PRODUCT_NAME: Record<string, string> = {
  "credit-strategy-simulator": "Credit Strategy Simulator",
  "sme-credit-decisioning": "SME Credit Decisioning Workbench",
  "similar-portfolio-intelligence": "Similar Portfolio Intelligence",
  riva: "RIVA",
};

export const OFFERINGS = Object.entries(PRODUCT_NAME).map(([value, label]) => ({ value, label }));
