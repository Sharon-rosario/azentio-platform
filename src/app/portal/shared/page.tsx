import { Search, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Banner } from "@/components/banner";
import { FilterSelect, MetaPill } from "@/components/learning/bits";
import { ReportButton } from "@/components/learning/report-actions";
import { Forbidden } from "@/components/portal/forbidden";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { date } from "@/lib/format";
import { PRODUCT_NAME } from "@/lib/products";
import { getPrincipal } from "@/server/auth";
import { feedFacets, sharedFeed } from "@/server/learning";
import { isForbidden, load } from "@/server/page";
import { can } from "@/server/policy";

export const metadata: Metadata = { title: "Shared learning" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

export default async function SharedPage({ searchParams }: PageProps<"/portal/shared">) {
  const sp = await searchParams;
  const filters = { q: one(sp.q), offering: one(sp.offering), industry: one(sp.industry), region: one(sp.region), category: one(sp.category) };
  const data = await load(async (p) => ({ items: await sharedFeed(p, filters), facets: await feedFacets(p) }), "/portal/shared");
  if (isForbidden(data)) return <Forbidden message={data.forbidden} />;
  const p = (await getPrincipal())!;
  const canReport = can(p, "reports.create");
  const { items, facets } = data;
  const filtered = Object.values(filters).some(Boolean);
  const opts = (vs: string[], label = (v: string) => v) => vs.map((v) => ({ value: v, label: label(v) }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shared learning"
        description="What client organisations have learned, after a moderator's review. No customer or account details, no internal notes."
      />

      <Banner tone="info">Only reviewed, de-identified copies appear here; withdrawn items disappear immediately.</Banner>

      <Panel>
        <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto] lg:items-end">
          <div className="grid gap-1.5 sm:col-span-2 lg:col-span-1">
            <label htmlFor="filter-q" className="text-[13px] font-medium">Search</label>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" strokeWidth={1.75} />
              <Input id="filter-q" name="q" type="search" defaultValue={filters.q} placeholder="Title or text" className="h-10 pl-10 text-[14px]" />
            </div>
          </div>
          <FilterSelect name="offering" label="Offering" allLabel="All offerings" value={filters.offering}
            options={opts(facets.offering, (v) => PRODUCT_NAME[v] ?? v)} />
          <FilterSelect name="industry" label="Industry" allLabel="All industries" value={filters.industry} options={opts(facets.industry)} />
          <FilterSelect name="region" label="Region" allLabel="All regions" value={filters.region} options={opts(facets.region)} />
          <FilterSelect name="category" label="Category" allLabel="All categories" value={filters.category} options={opts(facets.category)} />
          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <Button type="submit" variant="dark">Filter</Button>
            {filtered && (
              <Button variant="ghost" render={<Link href="/portal/shared" />}>
                Clear
              </Button>
            )}
          </div>
        </form>
      </Panel>

      <p className="text-muted-foreground text-[13px]" aria-live="polite">
        <span className="tabular-nums">{items.length}</span> {items.length === 1 ? "item" : "items"}
        {filtered ? " match these filters" : " published"}
      </p>

      {items.length ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {items.map((s) => (
            <li key={s.id} className="bg-card flex flex-col rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[15px] leading-5 font-medium">{s.title}</h2>
                {s.mine && (
                  <span className="bg-brand-soft text-primary inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-medium">
                    Yours
                  </span>
                )}
              </div>
              <p className="mt-2 text-[14px] leading-[22px] whitespace-pre-wrap">{s.body}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <MetaPill>{s.category}</MetaPill>
                <MetaPill>{PRODUCT_NAME[s.offering] ?? s.offering}</MetaPill>
                <MetaPill>{s.industry}</MetaPill>
                <MetaPill>{s.region}</MetaPill>
                <MetaPill>{s.period}</MetaPill>
                <MetaPill>Evidence: {s.evidence_type}</MetaPill>
                <MetaPill>Confidence: {s.confidence}</MetaPill>
              </div>
              <div className="text-muted-foreground mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t pt-3 text-[12px]">
                <span>
                  <span className="text-foreground font-medium">{s.attribution ?? "De-identified"}</span>
                  {s.theme && <> · Theme: {s.theme}</>}
                  {" · "}Published <span className="tabular-nums">{date(s.published_at)}</span>
                  {s.version > 1 && <> · Version <span className="tabular-nums">{s.version}</span></>}
                </span>
                {canReport && !s.mine && <ReportButton sharedId={s.id} title={s.title} />}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Panel>
          {filtered ? (
            <EmptyState
              icon={SearchX}
              title="Nothing matches these filters"
              description="Try a broader search or clear a filter."
              action={<Button variant="outline" size="sm" render={<Link href="/portal/shared" />}>Clear filters</Button>}
            />
          ) : (
            <EmptyState
              title="Nothing has been published yet"
              description="When a moderator publishes a reviewed copy of a client's observation, it appears here."
            />
          )}
        </Panel>
      )}
    </div>
  );
}
