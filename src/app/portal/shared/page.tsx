import { Search, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { FilterSelect } from "@/components/learning/bits";
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
  const filters = { q: one(sp.q), offering: one(sp.offering), industry: one(sp.industry), region: one(sp.region), category: one(sp.category),
    period: one(sp.period) };
  const data = await load(async (p) => ({ items: await sharedFeed(p, filters), facets: await feedFacets(p) }), "/portal/shared");
  if (isForbidden(data)) return <Forbidden message={data.forbidden} />;
  const p = (await getPrincipal())!;
  const canReport = can(p, "reports.create");
  const { items, facets } = data;
  const filtered = Object.values(filters).some(Boolean);
  const opts = (vs: string[], label = (v: string) => v) => vs.map((v) => ({ value: v, label: label(v) }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Shared learning"
        description="What client organisations have learned, as reviewed, de-identified copies. No customer or account details, no internal notes; a withdrawn item disappears at once."
      />

      <Panel>
        <form method="get" className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto] lg:items-end">
          <div className="col-span-2 grid gap-1.5 lg:col-span-1">
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
          <FilterSelect name="period" label="Observation period" allLabel="All periods" value={filters.period} options={opts(facets.period)} />
          <div className="col-span-2 flex gap-2 lg:col-span-1">
            <Button type="submit" variant="dark">Filter</Button>
            {filtered && (
              <Button variant="ghost" render={<Link href="/portal/shared" />}>
                Clear
              </Button>
            )}
          </div>
        </form>
      </Panel>

      <p className="text-muted-foreground font-mono text-[12px] leading-4" aria-live="polite">
        <span className="tabular-nums">{items.length}</span> {items.length === 1 ? "item" : "items"}
        {filtered ? " match these filters" : " published"}
      </p>

      {items.length ? (
        <ul className="space-y-4">
          {items.map((s) => (
            <li key={s.id} className="bg-card shadow-card grid gap-5 rounded-2xl border p-6 lg:grid-cols-12 lg:gap-6 lg:p-7">
              <article className="lg:col-span-8 lg:col-start-5 lg:row-start-1">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-[20px] leading-[28px] tracking-[-0.01em] text-balance">{s.title}</h2>
                  {s.mine && <span className="text-primary shrink-0 pt-1 font-mono text-[12px] leading-5">yours</span>}
                </div>
                <p className="mt-3 max-w-[68ch] text-[16px] leading-[26px] whitespace-pre-wrap">{s.body}</p>
                <div className="text-muted-foreground mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[13px] leading-5">
                  <span>
                    <span className="text-foreground font-medium">{s.attribution ?? "De-identified"}</span>
                    {s.theme && <> · Theme: {s.theme}</>}
                    {" · "}Published <span className="tabular-nums">{date(s.published_at)}</span>
                    {s.version > 1 && <> · Version <span className="tabular-nums">{s.version}</span></>}
                  </span>
                  {canReport && !s.mine && <ReportButton sharedId={s.id} title={s.title} />}
                </div>
              </article>
              <dl className="bg-muted/70 grid h-fit grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-xl p-4 font-mono text-[12px] leading-5 lg:col-span-4 lg:row-start-1">
                {[
                  ["category", s.category],
                  ["offering", PRODUCT_NAME[s.offering] ?? s.offering],
                  ["industry", s.industry],
                  ["region", s.region],
                  ["period", s.period],
                  ["evidence", s.evidence_type],
                  ["confidence", s.confidence],
                ].map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="min-w-0 break-words">{v}</dd>
                  </div>
                ))}
              </dl>
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
