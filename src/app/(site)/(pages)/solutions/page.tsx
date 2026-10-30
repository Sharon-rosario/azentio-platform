import { ArrowUpRight, BarChart3, Bot, Check, FileSearch, Settings2, ShieldCheck, Workflow, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EntryIndex, SiteTitle } from "@/components/site/content-index";
import { SOLUTION_DETAIL } from "@/lib/catalog";
import { PRODUCT_NAME } from "@/lib/products";
import { listContent } from "@/server/content";

export const metadata: Metadata = { title: "Solutions" };

const ICON: Record<string, LucideIcon> = {
  "intelligent-decisioning": Workflow,
  "document-intelligence": FileSearch,
  "trusted-enterprise-ai": ShieldCheck,
  "ai-agents-automation": Bot,
  "analytics-insights": BarChart3,
  "configurable-ai-platforms": Settings2,
};

export default async function SolutionsPage() {
  const solutions = await listContent(null, "solution");
  // Published content first, then catalogue capabilities that have no content row yet (same card, code-defined copy).
  const fromContent = solutions.filter((s) => s.slug && SOLUTION_DETAIL[s.slug]).map((s) => ({ key: s.slug!, title: s.title, summary: s.summary }));
  const fromCatalogue = Object.entries(SOLUTION_DETAIL)
    .filter(([slug]) => !fromContent.some((c) => c.key === slug))
    .map(([slug, d]) => ({ key: slug, title: d.title, summary: d.summary }));
  const detailed = [...fromContent, ...fromCatalogue];
  const other = solutions.filter((s) => !(s.slug && SOLUTION_DETAIL[s.slug]));

  return (
    <div className="space-y-12">
      <SiteTitle
        title="Solutions"
        action={
          <Link href="/products" className="hover:text-primary rounded-sm text-[15px] font-medium underline decoration-1 underline-offset-[6px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring">
            See the products
          </Link>
        }
      >
        The problems our products solve together, across lending, documents and governed AI.
      </SiteTitle>

      {detailed.length > 0 && (
        <ul className="space-y-6">
          {detailed.map((s) => {
            const d = SOLUTION_DETAIL[s.key];
            const Icon = ICON[s.key] ?? Workflow;
            return (
              <li key={s.key} id={s.key} className="scroll-mt-24">
                <article className="bg-card shadow-card grid gap-8 rounded-2xl border p-6 sm:p-8 lg:grid-cols-12 lg:gap-6">
                  <div className="lg:col-span-5">
                    <span className="bg-navy text-brand grid size-12 place-items-center rounded-xl">
                      <Icon aria-hidden className="size-6" strokeWidth={1.75} />
                    </span>
                    <h2 className="mt-5 text-[24px] leading-[32px] tracking-[-0.02em]">{s.title}</h2>
                    <p className="text-muted-foreground mt-2 text-[16px] leading-[25px]">{s.summary}</p>
                    <p className="mt-6 text-[13px] font-semibold">Built from</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {d.products.map((p) => (
                        <li key={p}>
                          <Link
                            href={`/products/${p}`}
                            className="bg-brand-soft text-navy hover:bg-brand inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {PRODUCT_NAME[p] ?? p} <ArrowUpRight aria-hidden className="size-3.5" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="lg:col-span-6 lg:col-start-7">
                    <h3 className="text-[15px] leading-6">How it works</h3>
                    <ul className="mt-4 space-y-4">
                      {d.how.map((h) => (
                        <li key={h} className="flex gap-3.5 text-[15px] leading-6">
                          <span className="bg-brand-soft text-primary grid size-7 shrink-0 place-items-center rounded-full">
                            <Check aria-hidden className="size-4" strokeWidth={2.5} />
                          </span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
      {other.length > 0 && <EntryIndex items={other} empty="" />}
      {detailed.length === 0 && other.length === 0 && <EntryIndex items={[]} empty="No solutions are listed yet." />}
    </div>
  );
}
