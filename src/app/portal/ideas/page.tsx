import { Check, Lightbulb, Package, Tag } from "lucide-react";
import type { Metadata } from "next";

import { IdeaStatusControl } from "@/components/insights/idea-status-control";
import { PublishIdeaButton } from "@/components/insights/publish-idea-button";
import { SuggestIdeaButton } from "@/components/insights/suggest-idea-button";
import { Forbidden } from "@/components/portal/forbidden";
import { RelativeTime } from "@/components/relative-time";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { PRODUCT_NAME } from "@/lib/products";
import { cn } from "@/lib/utils";
import { getPrincipal } from "@/server/auth";
import { IDEA_STATUSES, listIdeas, listThemes } from "@/server/insights";
import { isForbidden, load } from "@/server/page";
import { can } from "@/server/policy";

export const metadata: Metadata = { title: "Improvements" };

// The roadmap's stages in order; "Not proceeding" is shown apart, as a closed outcome rather than a stage.
const STAGES = ["Proposed", "Under review", "Planned", "In progress", "Released"] as const;
// Groups are listed most active first, so what's moving now is at the top.
const ORDER = ["In progress", "Planned", "Under review", "Proposed", "Released", "Not proceeding"];

export default async function IdeasPage() {
  const data = await load(async (p) => ({
    ideas: await listIdeas(p),
    // Themes a suggestion can link to: only those with enough evidence behind them.
    themes: can(p, "ideas.suggest") ? (await listThemes(p)).filter((t) => !t.suppressed).map((t) => ({ id: t.id, name: t.name })) : [],
  }), "/portal/ideas");
  if (isForbidden(data)) return <Forbidden message={data.forbidden} />;
  const { ideas, themes } = data;
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
            : "Improvement ideas linked to approved themes. Clients see the title, status and public note only; suggestions stay internal until a product owner shows them."
        }
        actions={can(p, "ideas.suggest") ? <SuggestIdeaButton themes={themes} /> : undefined}
      />

      {ideas.length === 0 ? (
        <Panel>
          <EmptyState icon={Lightbulb} title="No improvement ideas yet"
            description="Product owners create ideas from themes that have enough evidence behind them." />
        </Panel>
      ) : !editable ? (
        <>
          <StageStrip count={count} />
          <ul aria-label="Improvement ideas" className="grid gap-4 md:grid-cols-2">
            {ORDER.flatMap((status) => ideas.filter((i) => i.status === status)).map((i) => (
              <li key={i.id} className="flex">
                <article className="bg-card shadow-card flex w-full flex-col rounded-2xl border p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <Meta offering={PRODUCT_NAME[i.offering] ?? i.offering} theme={i.theme} />
                    <StatusBadge value={i.status} />
                  </div>
                  {i.internal && <div className="mt-3"><InternalBadge /></div>}
                  <h3 className="mt-3 line-clamp-2 text-[17px] leading-6 font-semibold">{i.title}</h3>
                  <p className={cn("mt-1.5 line-clamp-3 text-[14px] leading-[22px]", !i.public_note && "text-muted-foreground")}>
                    {i.public_note || "No public update yet."}
                  </p>
                  <StageTrack status={i.status} className="mt-auto pt-5" />
                  <p className="text-muted-foreground mt-4 border-t pt-3 text-[12px] leading-4">
                    {i.owner} · Updated <RelativeTime iso={i.updated_at} />
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <StageStrip count={count} linked />

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
                          {i.internal && <InternalBadge />}
                          <h3 className="text-[16px] leading-6">{i.title}</h3>
                          <p className="text-muted-foreground mt-0.5 text-[13px]">
                            {[PRODUCT_NAME[i.offering] ?? i.offering, i.theme && `Theme: ${i.theme}`].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <StatusBadge value={i.status} />
                      </div>
                      <StageTrack status={i.status} className="mt-4 max-w-xl" />
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
                        {editable && (
                          <div className="space-y-3">
                            {i.internal && <PublishIdeaButton ideaId={i.id} />}
                            <IdeaStatusControl ideaId={i.id} status={i.status} note={i.public_note} statuses={IDEA_STATUSES} />
                          </div>
                        )}
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

function InternalBadge() {
  return (
    <span className="bg-warning-soft text-warning mb-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium">
      Internal suggestion
    </span>
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

/** How many ideas are at each stage; on the product owner's view each stage links to its group below. */
function StageStrip({ count, linked = false }: { count: (s: string) => number; linked?: boolean }) {
  return (
    <nav aria-label="Roadmap stages" className="bg-card shadow-card overflow-x-auto rounded-2xl border p-2">
      <ol className="flex min-w-max">
        {STAGES.map((s, i) => {
          const n = count(s);
          return (
            <li key={s} className="flex flex-1 items-center">
              <a
                href={linked && n ? `#stage-${i}` : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !n && "opacity-55", linked && n && "hover:bg-muted",
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
  );
}

/** Where an idea is on the way from proposed to released, as five connected steps. */
function StageTrack({ status, className }: { status: string; className?: string }) {
  const at = STAGES.indexOf(status as (typeof STAGES)[number]);
  if (at < 0) {
    return <p className={cn("text-muted-foreground text-[12px]", className)}>Closed: not proceeding</p>;
  }
  return (
    <div className={className}>
      <ol aria-label={`Stage ${at + 1} of ${STAGES.length}: ${status}`} className="flex items-center">
        {STAGES.map((s, i) => (
          <li key={s} className={cn("flex items-center", i < STAGES.length - 1 && "flex-1")}>
            <span
              aria-hidden
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full border-2",
                i < at ? "bg-navy border-navy text-white" : i === at
                  ? s === "Released" ? "bg-brand-strong border-brand-strong text-white" : "border-navy bg-card ring-navy/15 ring-4"
                  : "border-border bg-card",
              )}
            >
              {i < at || (i === at && s === "Released") ? <Check className="size-3" strokeWidth={3} /> : i === at ? <span className="bg-navy size-1.5 rounded-full" /> : null}
            </span>
            {i < STAGES.length - 1 && <span aria-hidden className={cn("mx-1 h-0.5 flex-1 rounded-full", i < at ? "bg-navy" : "bg-border")} />}
          </li>
        ))}
      </ol>
      <div className="text-muted-foreground mt-1.5 flex justify-between text-[11px] leading-4">
        <span className={cn(at === 0 && "text-foreground font-medium")}>Proposed</span>
        <span className={cn("hidden sm:inline", at > 0 && at < STAGES.length - 1 && "text-foreground font-medium")}>
          {at > 0 && at < STAGES.length - 1 ? status : "\u00a0"}
        </span>
        <span className={cn(at === STAGES.length - 1 && "text-foreground font-medium")}>Released</span>
      </div>
    </div>
  );
}

function Meta({ offering, theme }: { offering: string; theme: string | null | undefined }) {
  return (
    <div className="flex min-w-0 flex-wrap gap-1.5 text-[12px] leading-4">
      <span className="bg-muted inline-flex items-center gap-1 rounded-full px-2 py-1"><Package className="size-3" /> {offering}</span>
      {theme && <span className="bg-brand-soft inline-flex items-center gap-1 rounded-full px-2 py-1"><Tag className="size-3" /> {theme}</span>}
    </div>
  );
}
