import type { Metadata } from "next";
import Link from "next/link";

import { Wordmark } from "@/components/brand";
import { safePath } from "@/lib/safe-path";
import { DEMO_MODE } from "@/server/auth";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

// Demo personas: one per role, all synthetic. Only listed when DEMO_MODE is on.
const PERSONAS = [
  { email: "sara@meridianbank.example", who: "Sara", role: "Client member · Meridian Bank" },
  { email: "ravi@meridianbank.example", who: "Ravi", role: "Client admin · Meridian Bank" },
  { email: "chen@kestrelfinance.example", who: "Chen", role: "Client member · Kestrel Finance" },
  { email: "maya@advisory.example", who: "Maya", role: "Adviser in two client workspaces" },
  { email: "omar@azentio.com", who: "Omar", role: "Learning moderator" },
  { email: "priya@azentio.com", who: "Priya", role: "Product owner" },
  { email: "lena@azentio.com", who: "Lena", role: "Content publisher" },
  { email: "dev@azentio.com", who: "Kavya", role: "Employee" },
  { email: "admin@azentio.com", who: "Arjun", role: "Portal administrator" },
];

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safePath(sp.next) ?? "/portal";
  const as = DEMO_MODE && typeof sp.as === "string" ? PERSONAS.find((p) => p.email === sp.as)?.email : undefined;
  return (
    <main className="mx-auto grid min-h-svh w-full max-w-[1280px] content-center gap-14 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-6">
      <section className="lg:col-span-5">
        <Link href="/" className="inline-block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><Wordmark /></Link>
        <h1 className="mt-14 text-[44px] leading-[48px] font-semibold tracking-[-0.025em]">Sign in</h1>
        <p className="text-muted-foreground mt-4 max-w-md text-[17px] leading-[27px]">
          We email you a 6-digit code. Clients join through an invitation from their organisation; employees use their
          @azentio.com address.
        </p>
        <div className="max-w-md">
          <LoginForm key={as ?? ""} next={next} demo={DEMO_MODE} defaultEmail={as} />
        </div>
      </section>
      {DEMO_MODE && (
        <section aria-labelledby="personas-title" className="lg:col-span-6 lg:col-start-7 lg:pt-[92px]">
          <h2 id="personas-title" className="text-muted-foreground font-mono text-[12px] leading-4">demo personas</h2>
          <p className="text-muted-foreground mt-2 text-[14px] leading-5">
            Synthetic accounts, one per role. Pick one to fill in the email; nothing is emailed in the demo, so the code
            appears on screen from the outbox.
          </p>
          <ul className="mt-5 border-t">
            {PERSONAS.map((p) => (
              <li key={p.email} className="border-b">
                <Link
                  href={`/login?as=${encodeURIComponent(p.email)}${next !== "/portal" ? `&next=${encodeURIComponent(next)}` : ""}`}
                  aria-current={as === p.email ? "true" : undefined}
                  className="group hover:bg-muted/60 focus-visible:bg-muted aria-[current]:bg-muted grid gap-1 px-1 py-3 outline-none transition-colors duration-150 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-4"
                >
                  <span className="text-[15px] leading-6">
                    <span className="font-medium">{p.who}</span>
                    <span className="text-muted-foreground"> · {p.role}</span>
                  </span>
                  <span className="text-muted-foreground group-hover:text-foreground font-mono text-[12px] leading-4">{p.email}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
