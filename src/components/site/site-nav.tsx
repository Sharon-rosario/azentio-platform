"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export const SITE_NAV = [
  { href: "/products", label: "Products" },
  { href: "/solutions", label: "Solutions" },
  { href: "/insights", label: "Insights" },
  { href: "/hackathon/register", label: "Hackathons", match: "/hackathon" },
  { href: "/connect", label: "Request a demo" },
];

/** Public site navigation. On small screens it sits in its own row and scrolls sideways. */
export function SiteNav() {
  const path = usePathname();
  return (
    <ul className="flex gap-1">
      {SITE_NAV.map((i) => {
        const on = path.startsWith(i.match ?? i.href);
        return (
          <li key={i.href}>
            <Link
              href={i.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "focus-visible:ring-ring inline-flex h-9 items-center rounded-full px-3 text-[13px] whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2",
                on ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {i.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
