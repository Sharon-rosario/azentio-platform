import type { Metadata } from "next";

import { BroadcastList, ContentCard, upcoming } from "@/components/site/content-cards";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { listContent } from "@/server/content";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage() {
  const [insights, broadcasts] = await Promise.all([listContent(null, "insight"), listContent(null, "broadcast")]);
  const next = upcoming(broadcasts);
  const past = broadcasts.filter((b) => !next.includes(b));

  return (
    <div className="space-y-6">
      <PageHeader title="Insights" description="Notes from our teams and public broadcasts on credit, risk and governed AI." />
      <div className="grid items-start gap-3 lg:grid-cols-[1.6fr_1fr]">
        <section aria-label="Articles" className="space-y-3">
          {insights.length ? (
            insights.map((i) => <ContentCard key={i.id} item={i} />)
          ) : (
            <div className="bg-card rounded-2xl">
              <EmptyState title="No insights published yet" />
            </div>
          )}
        </section>
        <div className="space-y-3">
          <Panel title="Upcoming broadcasts" description="Public sessions anyone can join">
            <BroadcastList items={next} empty="No public broadcasts coming up" />
          </Panel>
          {past.length > 0 && (
            <Panel title="Past broadcasts">
              <BroadcastList items={past} />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
