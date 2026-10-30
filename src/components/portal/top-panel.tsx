import { Bell } from "lucide-react";
import Link from "next/link";

import { Wordmark } from "@/components/brand";
import { ROLE_LABEL, type Principal } from "@/server/policy";

import { NavLinks, UserMenu, WorkspaceSwitcher } from "./top-panel-client";

export type NavItem = { href: string; label: string };

/** The menu is built on the server from the active role's permissions. Hiding a link is a convenience; the API checks anyway. */
export function navFor(p: Principal): NavItem[] {
  const has = (perm: string) => p.perms.has(perm);
  return [
    { href: "/portal", label: "Home", show: !!p.membershipId },
    { href: "/portal/observations", label: "Contributions", show: has("observations.write") },
    { href: "/portal/shared", label: "Shared learning", show: has("shared.read") },
    { href: "/portal/themes", label: "Themes", show: has("themes.read") },
    { href: "/portal/ideas", label: "Improvements", show: has("ideas.read") },
    { href: "/portal/moderation", label: "Moderation", show: has("moderation.review") },
    { href: "/portal/live", label: "Live", show: has("content.employee") || has("content.client") },
    { href: "/portal/playground", label: "Playground", show: has("playground.use") },
    { href: "/portal/members", label: "Members", show: has("members.manage") || has("admin.orgs") },
    { href: "/portal/admin", label: "Admin", show: has("admin.audit") },
  ].filter((i) => i.show).map(({ href, label }) => ({ href, label }));
}

export function TopPanel({ p, unread }: { p: Principal; unread: number }) {
  const roleLabel = p.roles.map((r) => ROLE_LABEL[r]).join(" · ") || "No workspace";
  return (
    <header className="bg-navy sticky top-0 z-30 text-white shadow-nav">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6">
        <Link href="/portal" className="focus-visible:ring-brand shrink-0 rounded-sm outline-none focus-visible:ring-2">
          <Wordmark />
        </Link>
        <WorkspaceSwitcher
          active={p.membershipId}
          options={p.memberships.map((m) => ({ id: m.id, label: m.orgName, kind: m.kind }))}
        />
        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/portal/notifications"
            aria-label={unread ? `${unread} unread notifications` : "Notifications"}
            className="focus-visible:ring-brand relative grid size-9 place-items-center rounded-full text-white/85 transition-colors outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2"
          >
            <Bell className="size-[18px]" strokeWidth={1.75} />
            {unread > 0 && (
              <span className="bg-brand text-brand-foreground absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold tabular-nums">
                {unread}
              </span>
            )}
          </Link>
          <UserMenu name={p.name} email={p.email} role={roleLabel} />
        </div>
      </div>
      <nav aria-label="Portal" className="mx-auto max-w-[1280px] overflow-x-auto overflow-y-hidden px-4 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
        <NavLinks items={navFor(p)} />
      </nav>
    </header>
  );
}
