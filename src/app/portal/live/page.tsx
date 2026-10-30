import { CalendarClock, PlayCircle, Radio } from "lucide-react";
import type { Metadata } from "next";

import { ContentForm } from "@/components/admin/content-form";
import { Forbidden } from "@/components/portal/forbidden";
import { upcoming as upcomingOf } from "@/components/site/content-index";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { appConfig } from "@/config/app";
import { dateTime } from "@/lib/format";
import { PRODUCT_NAME } from "@/lib/products";
import { getPrincipal } from "@/server/auth";
import { listContent, type Content } from "@/server/content";
import { can } from "@/server/policy";

export const metadata: Metadata = { title: "Live" };

const AUDIENCE: Record<string, string> = {
  client: "Clients of the product, by entitlement",
  employee: "Azentio employees only",
  public: "Anyone; also on the website",
};

const part = (iso: string, opt: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: appConfig.timeZone, ...opt }).format(new Date(iso));

/** A calendar tile: month above a large day number. */
function DateTile({ iso, inverse }: { iso: string; inverse?: boolean }) {
  return (
    <span
      className={
        inverse
          ? "bg-brand text-brand-foreground grid size-16 shrink-0 place-items-center rounded-2xl text-center"
          : "bg-brand-soft text-navy grid size-14 shrink-0 place-items-center rounded-xl text-center"
      }
    >
      <span className="leading-none">
        <span className="block text-[11px] font-semibold tracking-wide uppercase">{part(iso, { month: "short" })}</span>
        <span className={inverse ? "mt-1 block text-[26px] font-semibold" : "mt-0.5 block text-[22px] font-semibold"}>
          {part(iso, { day: "numeric" })}
        </span>
      </span>
    </span>
  );
}

function meta(s: Content) {
  return [s.starts_at ? dateTime(s.starts_at) : "No date set", s.product && (PRODUCT_NAME[s.product] ?? s.product)].filter(Boolean).join(" · ");
}

export default async function LivePage() {
  const p = (await getPrincipal())!;
  const publisher = can(p, "content.publish");
  if (!can(p, "content.employee") && !can(p, "content.client") && !publisher) {
    return <Forbidden message="You don't have access to this" />;
  }
  // The service filters by audience and entitlement; whatever comes back is what this person may see.
  const sessions = await listContent(p, "broadcast");
  const upcoming = upcomingOf(sessions);
  const recordings = sessions.filter((s) => !upcoming.includes(s));
  const [next, ...later] = upcoming;
  const audiences = [...new Set(sessions.map((s) => s.audience))];

  return (
    <div className="space-y-6">
      <PageHeader title="Live" description="Sessions you can join and recordings you can watch. You only see what your audience and entitlements allow." />

      {sessions.length === 0 ? (
        <Panel>
          <EmptyState icon={Radio} title="No sessions for you right now" description="New sessions appear here when a publisher schedules one for your audience." />
        </Panel>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-12">
          <div className="min-w-0 space-y-6 lg:col-span-8">
            {next && (
              <section aria-labelledby="next-title" className="bg-navy shadow-lift relative overflow-hidden rounded-2xl p-6 text-white sm:p-7">
                <div aria-hidden className="bg-brand-strong/15 pointer-events-none absolute -top-12 -right-12 size-48 rotate-12 rounded-3xl" />
                <p className="text-brand relative flex items-center gap-2 text-[13px] font-medium">
                  <span className="bg-brand size-1.5 animate-pulse rounded-full motion-reduce:animate-none" /> Next up
                </p>
                <div className="relative mt-4 flex gap-5">
                  <DateTile iso={next.starts_at!} inverse />
                  <div className="min-w-0">
                    <h2 id="next-title" className="text-[22px] leading-[30px] tracking-[-0.02em]">{next.title}</h2>
                    <p className="text-navy-muted mt-1.5 text-[15px] leading-6">{next.summary}</p>
                    <p className="text-navy-muted mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                      <span className="inline-flex items-center gap-1.5 text-white"><CalendarClock className="size-4" /> {dateTime(next.starts_at)}</span>
                      {next.product && <span>{PRODUCT_NAME[next.product] ?? next.product}</span>}
                      <span>{AUDIENCE[next.audience]}</span>
                    </p>
                  </div>
                </div>
              </section>
            )}

            {later.length > 0 && (
              <Panel title="Upcoming" description={`${later.length} more scheduled`}>
                <ul className="-my-1 divide-y">
                  {later.map((s) => (
                    <li key={s.id} className="flex items-center gap-4 py-3.5">
                      <DateTile iso={s.starts_at!} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] leading-6 font-medium">{s.title}</p>
                        <p className="text-muted-foreground text-[13px] leading-5">{s.summary}</p>
                        <p className="text-muted-foreground mt-1 text-[12px] tabular-nums">{meta(s)}</p>
                      </div>
                      <StatusBadge value={s.audience} />
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {recordings.length > 0 && (
              <Panel title="Recordings" description="Past sessions, kept for the same audience">
                <ul className="-my-1 divide-y">
                  {recordings.map((s) => (
                    <li key={s.id} className="flex items-center gap-4 py-3.5">
                      <span className="bg-navy text-brand grid size-14 shrink-0 place-items-center rounded-xl">
                        <PlayCircle aria-hidden className="size-6" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] leading-6 font-medium">{recordingTitle(s.title)}</p>
                        <p className="text-muted-foreground text-[13px] leading-5">{s.summary}</p>
                        <p className="text-muted-foreground mt-1 text-[12px] tabular-nums">{meta(s)}</p>
                      </div>
                      <StatusBadge value={s.audience} />
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>

          <div className="space-y-6 lg:col-span-4">
            <Panel title="Who sees what" description="Checked on the server for every session">
              <ul className="space-y-3">
                {audiences.map((a) => (
                  <li key={a} className="flex items-start gap-3">
                    <StatusBadge value={a} />
                    <span className="text-muted-foreground text-[13px] leading-5">{AUDIENCE[a]}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-4 border-t pt-4 text-[13px] leading-5">
                Client sessions only reach organisations entitled to the product. Employee broadcasts never appear in a
                client workspace, search or AIRA.
              </p>
            </Panel>
            {publisher && (
              <Panel title="Publish content" description="Sessions, insights, experiments or demos">
                <ContentForm />
              </Panel>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** "Recording: governed AI in ..." is listed under Recordings already, so the prefix goes and the first letter is raised. */
function recordingTitle(title: string) {
  const t = title.replace(/^Recording:\s*/, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}
