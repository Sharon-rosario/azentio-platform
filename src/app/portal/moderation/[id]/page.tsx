import { ArrowLeft, Check, Minus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Banner } from "@/components/banner";
import { CONSENT_LABEL, Facts, Highlight } from "@/components/learning/bits";
import { ReviewForm } from "@/components/learning/review-form";
import { Forbidden } from "@/components/portal/forbidden";
import { PageHeader, Panel } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { dateTime } from "@/lib/format";
import { PRODUCT_NAME } from "@/lib/products";
import { listThemes } from "@/server/insights";
import { reviewItem } from "@/server/learning";
import { id as parseId } from "@/server/http";
import { isForbidden, load } from "@/server/page";
import { can } from "@/server/policy";

export const metadata: Metadata = { title: "Review contribution" };

export default async function ReviewPage({ params }: PageProps<"/portal/moderation/[id]">) {
  const { id } = await params;
  const data = await load(async (p) => {
    const item = await reviewItem(p, parseId(id));
    const themes = can(p, "themes.read") ? await listThemes(p) : [];
    return { item, themes: themes.map((t) => ({ id: t.id, name: t.name })) };
  }, `/portal/moderation/${id}`);
  if (isForbidden(data)) return <Forbidden message={data.forbidden} />;
  const { item: o, themes } = data;
  const waiting = o.status === "submitted";

  return (
    <div className="space-y-6">
      <Link
        href="/portal/moderation"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-sm text-[13px] outline-none focus-visible:ring-2"
      >
        <ArrowLeft className="size-4" /> Moderation
      </Link>

      <PageHeader
        title="Review contribution"
        description={`From ${o.org} · ${o.category} · ${PRODUCT_NAME[o.offering] ?? o.offering} · submitted ${dateTime(o.updated_at)}`}
        actions={<StatusBadge value={o.status} />}
      />

      {!waiting && (
        <Banner
          tone="success"
          title="Already published"
          action={<Button variant="outline" size="sm" render={<Link href="/portal/shared" />}>Open shared learning</Button>}
        >
          A reviewed copy of this contribution is live. If the author edits it, it comes back to this queue.
        </Banner>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="grid content-start gap-3">
          <Panel title="Original" description="As the author wrote it. Read-only, and never shown to other organisations.">
            <h3 className="text-[15px] font-medium">
              <Highlight text={o.title} matches={o.flags.map((f) => f.match)} />
            </h3>
            <p className="mt-2 text-[14px] leading-[22px] whitespace-pre-wrap">
              <Highlight text={o.body} matches={o.flags.map((f) => f.match)} />
            </p>
            {o.flags.length > 0 ? (
              <Banner tone="warning" className="mt-4" title={`${o.flags.length} possible sensitive ${o.flags.length === 1 ? "match" : "matches"}`}>
                <ul className="space-y-0.5">
                  {o.flags.map((f) => (
                    <li key={f.match} className="break-all">
                      {f.kind}: <span className="font-mono">{f.match}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-1.5">Automatic checks can miss things. Read for names and confidential terms too.</p>
              </Banner>
            ) : (
              <p className="text-muted-foreground mt-4 text-[13px]">
                No automatic flags. Automatic checks can miss things: read for names and confidential terms too.
              </p>
            )}
            <Facts
              className="mt-5 border-t pt-5"
              items={[
                ["Author", o.author],
                ["Organisation", o.org],
                ["Industry", o.industry],
                ["Region", o.region],
                ["Observation period", o.period],
                ["Evidence type", o.evidence_type],
                ["Confidence", o.confidence],
                ["Category", o.category],
              ]}
            />
          </Panel>

          <Panel title="Author's permissions" description="Recorded when they submitted it. You can't change these.">
            <ul className="space-y-2 text-[14px]">
              {(["publish", "attribute", "train"] as const).map((k) => (
                <li key={k} className="flex items-start gap-2">
                  {o.consents[k] ? (
                    <Check className="text-success mt-0.5 size-4 shrink-0" aria-label="Allowed" />
                  ) : (
                    <Minus className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-label="Not allowed" />
                  )}
                  <span className={o.consents[k] ? "" : "text-muted-foreground"}>
                    {CONSENT_LABEL[k]}
                    <span className="sr-only">: {o.consents[k] ? "allowed" : "not allowed"}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        {waiting ? (
          <ReviewForm
            id={o.id}
            org={o.org}
            original={{ title: o.title, body: o.body, period: o.period, region: o.region, industry: o.industry }}
            flags={o.flags}
            themes={themes}
            attributionAllowed={o.consents.attribute}
          />
        ) : (
          <Panel title="Reviewed copy">
            <p className="text-muted-foreground text-[13px]">
              The published copy is in shared learning. Nothing to review until the author submits a new version.
            </p>
          </Panel>
        )}
      </div>
    </div>
  );
}
