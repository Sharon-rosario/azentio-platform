import { ArrowLeft, Check, Minus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Banner } from "@/components/banner";
import { CONSENT_LABEL, Facts, Highlight } from "@/components/learning/bits";
import { ObservationActions } from "@/components/learning/observation-actions";
import { Forbidden } from "@/components/portal/forbidden";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { date, dateTime } from "@/lib/format";
import { PRODUCT_NAME } from "@/lib/products";
import { getObservation } from "@/server/learning";
import { isForbidden, load } from "@/server/page";

export const metadata: Metadata = { title: "Observation" };

function statusLine(status: string, visibility: string) {
  if (status === "draft") {
    if (visibility === "private") return "A private draft. Only you can see it.";
    if (visibility === "organisation") return "Visible to colleagues in your organisation. Not shared outside it.";
    return "Not submitted yet. Nothing is shared until a moderator publishes a reviewed copy.";
  }
  if (status === "submitted") return "Waiting for a learning moderator. Nothing new is shared until they publish a reviewed copy.";
  if (status === "returned") return "Back with the author for a change. Edit it, then submit again.";
  if (status === "published") return "A reviewed, de-identified copy is in shared learning.";
  if (status === "rejected") return "A moderator decided not to publish it. It stays with its author.";
  if (status === "withdrawn") return "Withdrawn. No shared copy is visible to anyone.";
  return null;
}

export default async function ObservationPage({ params, searchParams }: PageProps<"/portal/observations/[id]">) {
  const { id } = await params;
  const { share } = await searchParams;
  const o = await load((p) => getObservation(p, Number(id)), `/portal/observations/${id}`);
  if (isForbidden(o)) return <Forbidden message={o.forbidden} />;

  const canEdit = o.mine && ["draft", "returned", "published"].includes(o.status);
  const canSubmit = o.mine && ["draft", "returned"].includes(o.status);
  const canWithdraw = o.mine && o.status !== "withdrawn" && (o.visibility === "community" || o.shared.length > 0);
  const matches = o.flags.map((f) => f.match);

  return (
    <div className="space-y-6">
      <Link
        href="/portal/observations"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-sm text-[13px] outline-none focus-visible:ring-2"
      >
        <ArrowLeft className="size-4" /> Contributions
      </Link>

      <PageHeader
        title={o.title}
        description={`${o.category} · ${PRODUCT_NAME[o.offering] ?? o.offering}${o.mine ? "" : ` · by ${o.author}`}`}
        actions={
          <ObservationActions
            id={o.id}
            canEdit={canEdit}
            canSubmit={canSubmit}
            canWithdraw={canWithdraw}
            inReview={o.status === "submitted"}
            openSubmit={share === "1"}
          />
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={o.status} />
        <StatusBadge value={o.visibility} />
        <span className="text-muted-foreground text-[13px]">{statusLine(o.status, o.visibility)}</span>
      </div>

      {o.moderator_note && (o.status === "returned" || o.status === "rejected") && (
        <Banner
          tone={o.status === "returned" ? "warning" : "danger"}
          title={o.status === "returned" ? "A moderator asked for a change" : "A moderator decided not to publish this"}
        >
          {o.moderator_note}
        </Banner>
      )}

      {o.mine && o.flags.length > 0 && o.status !== "withdrawn" && (
        <Banner tone="warning" title="This looks like it contains sensitive data">
          <p>Remove these before you share it. A moderator will refuse to publish a copy that still contains them.</p>
          <ul className="mt-1.5 space-y-0.5">
            {o.flags.map((f) => (
              <li key={f.match} className="break-all">
                {f.kind}: <span className="font-mono">{f.match}</span>
              </li>
            ))}
          </ul>
        </Banner>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Observation" className="lg:col-span-2">
          <p className="text-[15px] leading-6 whitespace-pre-wrap">
            <Highlight text={o.body} matches={o.mine ? matches : []} />
          </p>
          <Facts
            className="mt-6 border-t pt-5"
            items={[
              ["Category", o.category],
              ["Offering", PRODUCT_NAME[o.offering] ?? o.offering],
              ["Observation period", o.period],
              ["Evidence type", o.evidence_type],
              ["Confidence", o.confidence],
              ["Industry · region", `${o.industry} · ${o.region}`],
              ["Created", date(o.created_at)],
              ["Last updated", dateTime(o.updated_at)],
            ]}
          />
        </Panel>

        <div className="grid content-start gap-3">
          <Panel title="Permissions" description="What the author has allowed for this observation">
            <ul className="space-y-2 text-[14px]">
              {(["store", "publish", "attribute", "train"] as const).map((k) => (
                <li key={k} className="flex items-start gap-2">
                  {o.consents[k] ? (
                    <Check className="text-success mt-0.5 size-4 shrink-0" aria-label="Allowed" />
                  ) : (
                    <Minus className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-label="Not allowed" />
                  )}
                  <span className={o.consents[k] ? "" : "text-muted-foreground"}>{CONSENT_LABEL[k]}</span>
                </li>
              ))}
            </ul>
            {o.consentHistory.length > 0 && (
              <>
                <h3 className="mt-5 text-[13px] font-medium">History</h3>
                <ol className="mt-2 divide-y text-[13px]">
                  {[...o.consentHistory].reverse().map((c, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3 py-1.5">
                      <span className="min-w-0">
                        {CONSENT_LABEL[c.purpose] ?? c.purpose}:{" "}
                        <span className={c.granted ? "text-success" : "text-muted-foreground"}>{c.granted ? "given" : "not given"}</span>
                      </span>
                      <span className="text-muted-foreground shrink-0 tabular-nums">{dateTime(c.at)}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </Panel>

          <Panel title="Shared versions" description="Reviewed copies published to the learning community">
            {o.shared.length ? (
              <ul className="divide-y text-[14px]">
                {o.shared.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                    <span>
                      Version <span className="tabular-nums">{s.version}</span>
                      <span className="text-muted-foreground block text-[12px] tabular-nums">Published {date(s.published_at)}</span>
                    </span>
                    <StatusBadge value={s.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                className="py-6"
                title="No shared copy"
                description="Only a learning moderator can publish one, after the author submits it with permission."
              />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
