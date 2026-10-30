import { ArrowRight, MailX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AcceptInvitation } from "@/components/admin/accept-invitation";
import { Banner } from "@/components/banner";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { date } from "@/lib/format";
import { getPrincipal } from "@/server/auth";
import { invitationFor } from "@/server/members";
import { ROLE_LABEL, type Role } from "@/server/policy";

export const metadata: Metadata = { title: "Invitation" };

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const [inv, p] = await Promise.all([invitationFor(token), getPrincipal()]);
  const problem = !inv
    ? "This invitation link isn't valid. Check you copied the whole link, or ask for a new invitation."
    : inv.accepted_at
      ? "This invitation has already been accepted. Each link works once."
      : inv.revoked_at
        ? "This invitation was withdrawn by the organisation."
        : inv.expires_at < new Date().toISOString()
          ? `This invitation expired on ${date(inv.expires_at)}. Ask the person who invited you for a new one.`
          : null;

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <section className="bg-card w-full max-w-[480px] rounded-2xl p-8">
        <Link href="/" className="outline-none focus-visible:underline"><Wordmark /></Link>

        {!inv || problem ? (
          <div className="mt-8">
            <span className="bg-muted grid size-10 place-items-center rounded-full">
              <MailX className="text-muted-foreground size-[18px]" strokeWidth={1.75} />
            </span>
            <h1 className="mt-4 text-[24px] leading-[30px] font-medium tracking-[-0.015em]">Invitation not available</h1>
            <p className="text-muted-foreground mt-2 text-[14px] leading-[22px]">{problem}</p>
            <Button variant="outline" className="mt-6" render={<Link href={p ? "/portal" : "/"} />}>
              {p ? "Go to your portal" : "Back to the home page"}
            </Button>
          </div>
        ) : (
          <div className="mt-8">
            <h1 className="text-[24px] leading-[30px] font-medium tracking-[-0.015em]">You&apos;re invited to {inv.org}</h1>
            <dl className="bg-muted mt-5 grid gap-3 rounded-[12px] p-4 text-[14px]">
              <Row label="Organisation" value={inv.org} />
              <Row label="Role" value={ROLE_LABEL[inv.role as Role] ?? inv.role} />
              <Row label="Invited email" value={inv.email} />
              <Row label="Valid until" value={date(inv.expires_at)} />
            </dl>
            <p className="text-muted-foreground mt-4 text-[13px] leading-5">
              Joining a workspace is not consent to share anything. Your contributions stay private until you choose to
              share each one.
            </p>

            <div className="mt-6">
              {!p ? (
                <Button render={<Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`} />}>
                  Sign in as {inv.email} to accept <ArrowRight />
                </Button>
              ) : p.email !== inv.email ? (
                <Banner tone="warning" title={`You're signed in as ${p.email}`}>
                  This invitation only works for {inv.email}. Sign out, then{" "}
                  <Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`} className="font-medium underline">
                    sign in with that address
                  </Link>
                  .
                </Banner>
              ) : (
                <AcceptInvitation token={token} />
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium break-all">{value}</dd>
    </div>
  );
}
