"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export const SITE_NAV = [
  { href: "/products", label: "Products" },
  { href: "/solutions", label: "Solutions" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/security", label: "Security" },
  { href: "/insights", label: "Insights" },
  { href: "/media", label: "Media" },
  { href: "/hackathon/register", label: "Hackathons", match: "/hackathon" },
  { href: "/about", label: "About" },
];

/** Public site navigation: plain text links, the current page underlined. Scrolls sideways on small screens. */
export function SiteNav() {
  const path = usePathname();
  return (
    <ul className="flex gap-6">
      {SITE_NAV.map((i) => {
        const on = path.startsWith(i.match ?? i.href);
        return (
          <li key={i.href}>
            <Link
              href={i.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center rounded-sm text-[14px] whitespace-nowrap underline-offset-[6px] transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on ? "text-foreground underline decoration-1" : "text-muted-foreground hover:text-foreground",
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
