import { ArrowRight, Bell, FileText, Layers, Lightbulb, Radio, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { RelativeTime } from "@/components/relative-time";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { cn } from "@/lib/utils";
import { safePath } from "@/lib/safe-path";
import { myNotifications } from "@/server/members";
import { isForbidden, load } from "@/server/page";

export const metadata: Metadata = { title: "Notifications" };

// Each notification links to where it happened; the link's section decides its icon.
const KIND: [string, LucideIcon][] = [
  ["/portal/observations", FileText],
  ["/portal/ideas", Lightbulb],
  ["/portal/live", Radio],
  ["/portal/themes", Layers],
  ["/portal/moderation", ShieldCheck],
  ["/portal/members", Users],
];
const iconFor = (link: string | null) => KIND.find(([prefix]) => link?.startsWith(prefix))?.[1] ?? Bell;

const TRIGGERS = [
  "A contribution of yours is published, returned, declined or removed after a report",
  "An improvement idea you can follow changes status",
  "You're invited to a session for your organisation",
  "Your membership or role changes",
];

export default async function NotificationsPage() {
  const items = await load((p) => myNotifications(p), "/portal/notifications");
  if (isForbidden(items)) return null;
  const unread = items.filter((n) => !n.read_at);
  const earlier = items.filter((n) => n.read_at);
  const groups = [
    { title: "New", items: unread },
    { title: "Earlier", items: earlier },
  ].filter((g) => g.items.length);

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Updates about your contributions, ideas you follow and your access. The latest 50." />
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          {groups.length ? (
            groups.map((g) => (
              <Panel key={g.title} title={g.title} description={`${g.items.length} ${g.items.length === 1 ? "update" : "updates"}`}>
                <ul className="-my-1 divide-y">
                  {g.items.map((n) => {
                    const Icon = iconFor(n.link);
                    const href = safePath(n.link);
                    return (
                      <li key={n.id} className="flex items-start gap-3.5 py-3.5">
                        <span className={cn("grid size-10 shrink-0 place-items-center rounded-full",
                          n.read_at ? "bg-muted text-muted-foreground" : "bg-brand-soft text-primary")}>
                          <Icon aria-hidden className="size-[18px]" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-[14px] leading-[22px]", !n.read_at && "font-medium")}>
                            {!n.read_at && <span className="sr-only">Unread: </span>}
                            {n.text}
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-[12px]">
                            <RelativeTime iso={n.created_at} />
                          </p>
                        </div>
                        {href && (
                          <Link
                            href={href}
                            className="text-primary mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-sm text-[13px] font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            Open <ArrowRight className="size-3.5" />
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            ))
          ) : (
            <Panel>
              <EmptyState icon={Bell} title="No notifications" description="You'll hear here when something you contributed to changes." />
            </Panel>
          )}
        </div>
        <Panel title="What you hear about" description="In-app only; nothing is emailed from this demo" className="lg:col-span-4">
          <ul className="space-y-2.5">
            {TRIGGERS.map((t) => (
              <li key={t} className="text-muted-foreground flex gap-2.5 text-[13px] leading-5">
                <span aria-hidden className="bg-brand-strong mt-[7px] size-1.5 shrink-0 rounded-full" />
                {t}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
