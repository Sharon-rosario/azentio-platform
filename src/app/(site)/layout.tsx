import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Wordmark } from "@/components/brand";
import { SiteNav } from "@/components/site/site-nav";
import { Button } from "@/components/ui/button";
import { OFFERINGS } from "@/lib/products";
import { getPrincipal } from "@/server/auth";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const p = await getPrincipal();
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="bg-foreground text-background sr-only z-50 rounded-full px-4 py-2 text-[13px] focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <header className="bg-background/95 supports-[backdrop-filter]:bg-background/85 sticky top-0 z-30 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-8 px-4 sm:px-6">
          <Link href="/" className="shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Wordmark />
          </Link>
          <nav aria-label="Main" className="hidden md:block">
            <SiteNav />
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-5">
            {p ? (
              <Button variant="dark" size="sm" render={<Link href="/portal" />}>
                Open portal <ArrowRight />
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground hidden rounded-sm text-[14px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring sm:inline"
                >
                  Sign in
                </Link>
                <Button variant="dark" size="sm" render={<Link href="/connect" />}>
                  Request a demo
                </Button>
              </>
            )}
          </div>
        </div>
        <nav aria-label="Main" className="overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
          <SiteNav />
        </nav>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 pt-14 pb-10 sm:px-6 md:grid-cols-12">
          <div className="md:col-span-5">
            <Wordmark />
            <p className="text-muted-foreground mt-4 max-w-sm text-[14px] leading-[22px]">
              AI credit products, and a portal where client organisations learn from each other without exposing who
              said what.
            </p>
          </div>
          <FooterList className="md:col-span-4" title="Products" links={OFFERINGS.map((o) => ({ href: `/products/${o.value}`, label: o.label }))} />
          <FooterList
            className="md:col-span-3"
            title="Company"
            links={[
              { href: "/solutions", label: "Solutions" },
              { href: "/insights", label: "Insights" },
              { href: "/security", label: "Security" },
              { href: "/hackathon/register", label: "Hackathons" },
              { href: "/connect", label: "Request a demo" },
            ]}
          />
        </div>
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <p className="text-muted-foreground border-t py-6 text-[12px] leading-4">
            Built for the azentio.ai Build Labs challenge. Every organisation, person and figure on this site and in the
            portal is synthetic.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FooterList({ title, links, className }: { title: string; links: { href: string; label: string }[]; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[13px] font-medium">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-muted-foreground hover:text-foreground rounded-sm text-[14px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
