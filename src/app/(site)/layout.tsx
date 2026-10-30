import { ArrowRight, LogIn } from "lucide-react";
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
      <header className="bg-card sticky top-0 z-30 border-b">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="shrink-0 outline-none focus-visible:underline">
            <Wordmark />
          </Link>
          <nav aria-label="Main" className="hidden md:block">
            <SiteNav />
          </nav>
          <div className="ml-auto shrink-0">
            {p ? (
              <Button variant="dark" size="sm" render={<Link href="/portal" />}>
                Open portal <ArrowRight />
              </Button>
            ) : (
              <Button variant="outline" size="sm" render={<Link href="/login" />}>
                <LogIn /> Sign in
              </Button>
            )}
          </div>
        </div>
        <nav aria-label="Main" className="overflow-x-auto px-3 pb-2 md:hidden">
          <SiteNav />
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="border-t">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 sm:grid-cols-[1.4fr_1fr_1fr] sm:px-6">
          <div className="space-y-3">
            <Wordmark />
            <p className="text-muted-foreground max-w-xs text-[13px] leading-5">
              Synthetic data for the azentio.ai Build Labs challenge. Every organisation, person and figure here is made up.
            </p>
          </div>
          <FooterList title="Products" links={OFFERINGS.map((o) => ({ href: `/products/${o.value}`, label: o.label }))} />
          <FooterList
            title="Company"
            links={[
              { href: "/solutions", label: "Solutions" },
              { href: "/insights", label: "Insights" },
              { href: "/hackathon/register", label: "Hackathons" },
              { href: "/connect", label: "Request a demo" },
              { href: "/security", label: "Security overview" },
            ]}
          />
        </div>
      </footer>
    </div>
  );
}

function FooterList({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-[13px] font-medium">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-muted-foreground hover:text-foreground text-[13px] outline-none focus-visible:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
