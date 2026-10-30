import { Check, Lightbulb } from "lucide-react";
import type { Metadata } from "next";

import { IdeaStatusControl } from "@/components/insights/idea-status-control";
import { Forbidden } from "@/components/portal/forbidden";
import { RelativeTime } from "@/components/relative-time";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { PRODUCT_NAME } from "@/lib/products";
import { cn } from "@/lib/utils";
import { getPrincipal } from "@/server/auth";
import { IDEA_STATUSES, listIdeas } from "@/server/insights";
import { isForbidden, load } from "@/server/page";
import { can } from "@/server/policy";

export const metadata: Metadata = { title: "Improvements" };

// The roadmap's stages in order; "Not proceeding" is shown apart, as a closed outcome rather than a stage.
const STAGES = ["Proposed", "Under review", "Planned", "In progress", "Released"] as const;
// Groups are listed most active first, so what's moving now is at the top.
const ORDER = ["In progress", "Planned", "Under review", "Proposed", "Released", "Not proceeding"];

export default async function IdeasPage() {
  const ideas = await load((p) => listIdeas(p), "/portal/ideas");
  if (isForbidden(ideas)) return <Forbidden message={ideas.forbidden} />;
  const p = (await getPrincipal())!;
  const editable = can(p, "ideas.write");
  const client = p.orgKind === "client";
  const count = (s: string) => ideas.filter((i) => i.status === s).length;
  const groups = ORDER.map((status) => ({ status, items: ideas.filter((i) => i.status === status) })).filter((g) => g.items.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Improvements"
        description={
          client
            ? "Ideas that came out of shared learning, and where each one stands. You see the status and the public note."
            : "Improvement ideas linked to approved themes. Clients see the title, status and public note only."
        }
      />

      {ideas.length === 0 ? (
        <Panel>
          <EmptyState icon={Lightbulb} title="No improvement ideas yet"
            description="Product owners create ideas from themes that have enough evidence behind them." />
        </Panel>
      ) : !editable ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <ol aria-label="Roadmap" className="grid min-w-[1060px] grid-cols-5 gap-4">
            {STAGES.map((stage) => {
              const items = ideas.filter((i) => i.status === stage);
              return (
                <li key={stage} className="bg-muted/70 flex flex-col rounded-2xl border p-3">
                  <h2 className="flex items-center justify-between px-1 pb-3 text-[14px] leading-5">
                    <span className="flex items-center gap-2">
                      <span aria-hidden className={cn("size-2 rounded-full", stage === "Released" ? "bg-brand-strong" : "bg-navy")} />
                      {stage}
                    </span>
                    <span className="text-muted-foreground text-[13px] font-normal tabular-nums">{items.length}</span>
                  </h2>
                  {items.length ? (
                    <ul className="space-y-3">
                      {items.map((i) => (
                        <li key={i.id}>
                          <article className="bg-card shadow-card rounded-xl border p-4">
                            <h3 className="text-[14px] leading-5">{i.title}</h3>
                            <p className="text-muted-foreground mt-1 text-[12px] leading-4">
                              {[PRODUCT_NAME[i.offering] ?? i.offering, i.theme && `Theme: ${i.theme}`].filter(Boolean).join(" · ")}
                            </p>
                            {i.public_note && (
                              <p className="border-brand-strong mt-3 border-l-2 pl-2.5 text-[13px] leading-5">{i.public_note}</p>
                            )}
                            <p className="text-muted-foreground mt-3 text-[11px] leading-4">
                              {i.owner} · <RelativeTime iso={i.updated_at} />
                            </p>
                          </article>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground rounded-xl border border-dashed px-3 py-6 text-center text-[12px]">Nothing here yet</p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <>
          <nav aria-label="Roadmap stages" className="bg-card shadow-card overflow-x-auto rounded-2xl border p-2">
            <ol className="flex min-w-max">
              {STAGES.map((s, i) => {
                const n = count(s);
                return (
                  <li key={s} className="flex flex-1 items-center">
                    <a
                      href={n ? `#stage-${i}` : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        n ? "hover:bg-muted" : "opacity-55",
                      )}
                    >
                      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-semibold tabular-nums",
                        s === "Released" ? "bg-brand text-brand-foreground" : n ? "bg-navy text-white" : "bg-muted text-muted-foreground")}>
                        {s === "Released" && n ? <Check className="size-4" strokeWidth={2.5} /> : n}
                      </span>
                      <span className="text-[14px] leading-5 font-medium whitespace-nowrap">{s}</span>
                    </a>
                    {i < STAGES.length - 1 && <span aria-hidden className="bg-border mx-1 h-px w-6 shrink-0" />}
                  </li>
                );
              })}
            </ol>
          </nav>

          {groups.map((g) => (
            <section key={g.status} id={`stage-${STAGES.indexOf(g.status as (typeof STAGES)[number])}`} aria-labelledby={`h-${g.status}`} className="scroll-mt-28 space-y-3">
              <h2 id={`h-${g.status}`} className="flex items-center gap-2 text-[16px] leading-6">
                {g.status} <span className="text-muted-foreground text-[14px] font-normal tabular-nums">{g.items.length}</span>
              </h2>
              <ul className={cn("grid gap-4", !editable && "lg:grid-cols-2")}>
                {g.items.map((i) => (
                  <li key={i.id}>
                    <article className="bg-card shadow-card flex h-full flex-col rounded-2xl border p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-[16px] leading-6">{i.title}</h3>
                          <p className="text-muted-foreground mt-0.5 text-[13px]">
                            {[PRODUCT_NAME[i.offering] ?? i.offering, i.theme && `Theme: ${i.theme}`].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <StatusBadge value={i.status} />
                      </div>
                      <div className={cn("mt-4 grid flex-1 gap-5", editable && "lg:grid-cols-[1fr_minmax(0,22rem)]")}>
                        <div className="space-y-3">
                          {i.public_note ? (
                            <p className="border-brand-strong bg-brand-soft/60 rounded-r-lg border-l-[3px] px-3 py-2 text-[14px] leading-[22px]">
                              {i.public_note}
                            </p>
                          ) : (
                            <p className="text-muted-foreground text-[13px]">No public update yet.</p>
                          )}
                          {i.problem !== undefined && (
                            <dl className="grid gap-3 sm:grid-cols-2">
                              <Internal label="Problem" value={i.problem} />
                              <Internal label="Proposed outcome" value={i.proposed_outcome} />
                              <Internal label="Priority" value={i.priority} />
                            </dl>
                          )}
                          <p className="text-muted-foreground text-[12px]">
                            Owner: {i.owner} · Updated <RelativeTime iso={i.updated_at} />
                          </p>
                        </div>
                        {editable && <IdeaStatusControl ideaId={i.id} status={i.status} note={i.public_note} statuses={IDEA_STATUSES} />}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}

function Internal({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <dt className="text-muted-foreground text-[12px]">{label} · internal</dt>
      <dd className="mt-0.5 text-[14px] leading-[22px]">{value || "—"}</dd>
    </div>
  );
}
