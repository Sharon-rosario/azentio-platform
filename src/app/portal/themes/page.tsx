import { Check, EyeOff, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CreateIdeaButton } from "@/components/insights/create-idea-button";
import { SynthesizeButton } from "@/components/insights/synthesize-button";
import { Forbidden } from "@/components/portal/forbidden";
import { AiraFootnote, AiraMark } from "@/components/aira";
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
      <Panel title={<span className="text-[24px] leading-[30px] font-semibold tracking-[-0.015em]">{t.name}</span>} description={offering}>
        <p className="text-muted-foreground flex items-start gap-2 text-[15px] leading-6">
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
        <span className="flex flex-wrap items-center gap-3 text-[24px] leading-[30px] font-semibold tracking-[-0.015em]">
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
      <p className="max-w-[68ch] text-[16px] leading-[26px]">{t.description}</p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <Fact label="distinct organisations" value={<span className="tabular-nums">{t.orgs ?? 0}</span>} />
        <Fact label="contributions" value={<span className="tabular-nums">{t.contributions ?? 0}</span>} />
        <Fact label="observation period" value={<span className="text-[16px] leading-6">{t.period ?? "—"}</span>} />
      </dl>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-6">
        <section aria-labelledby={`ev-${t.id}`}>
          <h3 id={`ev-${t.id}`} className="text-muted-foreground font-mono text-[12px] leading-4">evidence</h3>
          {t.evidence.length ? (
            <ul className="mt-3 border-t">
              {t.evidence.map((e) => (
                <li key={e.id} className="border-b py-3.5">
                  <p className="text-[15px] leading-6 font-medium">{e.title}</p>
                  <p className="text-muted-foreground mt-0.5 line-clamp-3 text-[14px] leading-[21px]">{e.body}</p>
                  <p className="text-muted-foreground mt-2 font-mono text-[12px] leading-4">
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
          <h3 id={`sum-${t.id}`}><AiraMark job="theme summary" /></h3>
          {t.summary ? (
            <div className="border-primary mt-3 border-l-2 pl-5">
              <p className="text-[16px] leading-[26px] whitespace-pre-line">{t.summary}</p>
              <AiraFootnote model={t.summary_model} className="mt-3">
                Written from approved contributions only, and every quote is checked word for word against its source.
                {t.summary_at && <> {dateTime(t.summary_at)}.</>}
              </AiraFootnote>
              {t.citations.length > 0 && (
                <ul className="mt-4 border-t">
                  {t.citations.map((c, i) => (
                    <li key={i} className="flex gap-2.5 border-b py-2.5 text-[14px] leading-[21px]">
                      <Check aria-label="Verified" className="text-primary mt-1 size-3.5 shrink-0" strokeWidth={2.5} />
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

          <h3 className="text-muted-foreground mt-8 font-mono text-[12px] leading-4">linked improvement ideas</h3>
          {t.ideas.length ? (
            <ul className="mt-3 divide-y border-y">
              {t.ideas.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-3 text-[15px] leading-6">
                  <Link href="/portal/ideas" className="min-w-0 truncate outline-none hover:underline focus-visible:underline">
                    {i.title}
                  </Link>
                  <StatusBadge value={i.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground mt-3 text-[14px]">No ideas linked to this theme yet.</p>
          )}
        </section>
      </div>
    </Panel>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-brand-soft rounded-xl p-4">
      <dt className="text-primary font-mono text-[12px] leading-4">{label}</dt>
      <dd className="mt-1.5 text-[26px] leading-[32px] font-semibold tracking-[-0.02em]">{value}</dd>
    </div>
  );
}
