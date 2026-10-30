import type { Metadata } from "next";

import { BroadcastList, EntryIndex, SiteTitle, upcoming } from "@/components/site/content-index";
import { listContent } from "@/server/content";

export const metadata: Metadata = { title: "Insights" };

export default async function InsightsPage() {
  const [insights, broadcasts] = await Promise.all([listContent(null, "insight"), listContent(null, "broadcast")]);
  const next = upcoming(broadcasts);
  const past = broadcasts.filter((b) => !next.includes(b));

  return (
    <div className="space-y-12">
      <SiteTitle title="Insights from the teams building it." highlight="building it.">Notes from our teams, and public broadcasts on credit, risk and governed AI.</SiteTitle>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-6">
        <section aria-label="Articles" className="lg:col-span-8">
          <EntryIndex items={insights} empty="No insights are published yet." />
        </section>
        <div className="space-y-10 lg:col-span-3 lg:col-start-10">
          <section data-reveal aria-labelledby="upcoming-title">
            <h2 id="upcoming-title" className="text-muted-foreground mb-3 font-mono text-[12px] leading-4">upcoming broadcasts</h2>
            <BroadcastList items={next} empty="None scheduled right now." />
          </section>
          {past.length > 0 && (
            <section aria-labelledby="past-title">
              <h2 id="past-title" className="text-muted-foreground mb-3 font-mono text-[12px] leading-4">past broadcasts</h2>
              <BroadcastList items={past} empty="" />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
