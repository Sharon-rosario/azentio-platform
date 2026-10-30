import { ArrowRight, Bell } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { RelativeTime } from "@/components/relative-time";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { cn } from "@/lib/utils";
import { safePath } from "@/lib/safe-path";
import { myNotifications } from "@/server/members";
import { isForbidden, load } from "@/server/page";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const items = await load((p) => myNotifications(p), "/portal/notifications");
  if (isForbidden(items)) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Updates about your contributions, ideas you follow and your access. The latest 50." />
      <Panel>
        {items.length ? (
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  aria-hidden
                  className={cn("mt-2 size-1.5 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-primary")}
                />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[14px] leading-[22px]", !n.read_at && "font-medium")}>
                    {!n.read_at && <span className="sr-only">Unread: </span>}
                    {n.text}
                  </p>
                  <p className="text-muted-foreground text-[12px]">
                    <RelativeTime iso={n.created_at} />
                  </p>
                </div>
                {safePath(n.link) && (
                  <Link
                    href={safePath(n.link)!}
                    className="text-primary inline-flex shrink-0 items-center gap-1 text-[13px] outline-none hover:underline focus-visible:underline"
                  >
                    Open <ArrowRight className="size-3.5" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Bell} title="No notifications" description="You'll hear here when something you contributed to changes." />
        )}
      </Panel>
    </div>
  );
}
