import { EyeOff, Lightbulb, Quote, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CreateIdeaButton } from "@/components/insights/create-idea-button";
import { SynthesizeButton } from "@/components/insights/synthesize-button";
import { Forbidden } from "@/components/portal/forbidden";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { StatusBadge, TONES } from "@/components/status-badge";
import { dateTime } from "@/lib/format";
import { PRODUCT_NAME } from "@/lib/products";
import { cn } from "@/lib/utils";
import { getPrincipal } from "@/server/auth";
import { listThemes, MIN_ORGS, type Theme } from "@/server/insights";
import { isForbidden, load } from "@/server/page";
import { can, type Principal } from "@/server/policy";

export const metadata: Metadata = { title: "Themes" };

export default async function ThemesPage() {
  const themes = await load((p) => listThemes(p), "/portal/themes");
  if (isForbidden(themes)) return <Forbidden message={themes.forbidden} />;
  const p = (await getPrincipal())!;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Themes"
        description={`Published, de-identified contributions grouped by topic. A theme's details are shared once at least ${MIN_ORGS} distinct organisations stand behind it.`}
      />
      {themes.length ? (
        <div className="space-y-3">
          {themes.map((t) => (
            <ThemePanel key={t.id} t={t} p={p} />
          ))}
        </div>
      ) : (
        <Panel>
          <EmptyState title="No themes yet" description="Moderators assign published contributions to themes as they review them." />
        </Panel>
      )}
    </div>
  );
}

function ThemePanel({ t, p }: { t: Theme; p: Principal }) {
  const offering = PRODUCT_NAME[t.offering] ?? t.offering;

  if (t.suppressed) {
    return (
      <Panel title={t.name} description={offering}>
        <p className="text-muted-foreground flex items-start gap-2 text-[14px]">
          <EyeOff className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
          Not enough organisations yet (needs at least {MIN_ORGS} distinct organisations before details are shared)
        </p>
      </Panel>
    );
  }

  const below = (t.orgs ?? 0) < MIN_ORGS;
  const titleOf = new Map(t.evidence.map((e) => [e.id, e.title]));
  const actions = [
    can(p, "themes.synthesize") && !below && <SynthesizeButton key="s" themeId={t.id} hasSummary={!!t.summary} />,
    can(p, "ideas.write") && !below && <CreateIdeaButton key="i" themeId={t.id} themeName={t.name} offering={t.offering} />,
  ].filter(Boolean);

  return (
    <Panel
      title={
        <span className="flex flex-wrap items-center gap-2">
          {t.name}
          {below && (
            <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium", TONES.warning)}>
              Below threshold: visible to moderators only
            </span>
          )}
        </span>
      }
      description={offering}
      action={actions.length ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : undefined}
    >
      <p className="text-[14px] leading-[22px]">{t.description}</p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <Fact label="Distinct organisations" value={<span className="tabular-nums">{t.orgs ?? 0}</span>} />
        <Fact label="Contributions" value={<span className="tabular-nums">{t.contributions ?? 0}</span>} />
        <Fact label="Observation period" value={t.period ?? "—"} />
      </dl>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section aria-labelledby={`ev-${t.id}`}>
          <h3 id={`ev-${t.id}`} className="text-[13px] font-medium">Evidence</h3>
          {t.evidence.length ? (
            <ul className="mt-2 space-y-2">
              {t.evidence.map((e) => (
                <li key={e.id} className="bg-muted rounded-[12px] p-3">
                  <p className="text-[14px] font-medium">{e.title}</p>
                  <p className="text-muted-foreground mt-0.5 line-clamp-3 text-[13px] leading-5">{e.body}</p>
                  <p className="text-muted-foreground mt-1.5 text-[12px]">
                    {[e.industry, e.region, e.period].filter(Boolean).join(" · ")} · {e.attribution || "De-identified"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="py-6" title="No published contributions yet" />
          )}
        </section>

        <section aria-labelledby={`sum-${t.id}`}>
          <h3 id={`sum-${t.id}`} className="flex items-center gap-1.5 text-[13px] font-medium">
            <Sparkles className="text-primary size-3.5" /> AIRA summary
          </h3>
          {t.summary ? (
            <div className="mt-2 rounded-[12px] border p-3">
              <p className="text-[14px] leading-[22px] whitespace-pre-line">{t.summary}</p>
              <p className="text-muted-foreground mt-2 text-[12px]">
                AI-generated from approved contributions; quotes verified against sources.
                {(t.summary_model || t.summary_at) && (
                  <> {[t.summary_model, t.summary_at && dateTime(t.summary_at)].filter(Boolean).join(" · ")}</>
                )}
              </p>
              {t.citations.length > 0 && (
                <ul className="mt-3 space-y-2 border-t pt-3">
                  {t.citations.map((c, i) => (
                    <li key={i} className="flex gap-2 text-[13px]">
                      <Quote className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
                      <span>
                        <q className="italic">{c.quote}</q>
                        <span className="text-muted-foreground"> from &ldquo;{titleOf.get(c.shared_id) ?? "a contribution"}&rdquo;</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <EmptyState
              className="py-6"
              icon={Sparkles}
              title="Not summarised yet"
              description={
                below
                  ? `AIRA can summarise once ${MIN_ORGS} organisations have contributed.`
                  : "A moderator or product owner can ask AIRA to summarise the approved contributions."
              }
            />
          )}

          <h3 className="mt-5 text-[13px] font-medium">Linked improvement ideas</h3>
          {t.ideas.length ? (
            <ul className="mt-2 divide-y">
              {t.ideas.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-[14px]">
                  <Link href="/portal/ideas" className="flex min-w-0 items-center gap-2 outline-none hover:underline focus-visible:underline">
                    <Lightbulb className="text-muted-foreground size-4 shrink-0" />
                    <span className="truncate">{i.title}</span>
                  </Link>
                  <StatusBadge value={i.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground mt-2 text-[13px]">No ideas linked to this theme yet.</p>
          )}
        </section>
      </div>
    </Panel>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-muted rounded-[12px] px-3 py-2.5">
      <dt className="text-muted-foreground text-[12px]">{label}</dt>
      <dd className="mt-0.5 text-[15px] font-medium">{value}</dd>
    </div>
  );
}
