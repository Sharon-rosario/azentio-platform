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
  const next = (await searchParams).next;
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-[920px] gap-6 md:grid-cols-[1fr_1fr]">
        <section className="bg-card rounded-2xl p-8">
          <Link href="/" className="outline-none focus-visible:underline"><Wordmark /></Link>
          <h1 className="mt-8 text-[24px] leading-[30px] font-medium tracking-[-0.015em]">Sign in</h1>
          <p className="text-muted-foreground mt-1 text-[14px]">
            We email you a 6-digit code. Clients join through an invitation from their organisation; employees use their
            @azentio.com address.
          </p>
          <LoginForm next={safePath(next) ?? "/portal"} demo={DEMO_MODE} />
        </section>
        {DEMO_MODE && (
          <section className="rounded-2xl border border-dashed p-6">
            <p className="text-[13px] font-medium">Demo personas</p>
            <p className="text-muted-foreground mt-1 text-[13px]">
              Synthetic accounts, one per role. Nothing is emailed in the demo: the code appears on screen, taken from the
              outbox.
            </p>
            <ul className="mt-4 divide-y">
              {PERSONAS.map((p) => (
                <li key={p.email} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                  <span>
                    <span className="font-medium">{p.who}</span>
                    <span className="text-muted-foreground"> · {p.role}</span>
                  </span>
                  <code className="text-muted-foreground font-mono text-[11px]">{p.email}</code>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
