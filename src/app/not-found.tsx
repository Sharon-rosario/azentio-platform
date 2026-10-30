import { ArrowLeft, LayoutDashboard, Rows3 } from "lucide-react";
import Link from "next/link";

import { Mark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/config/app";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-16">
      <div className="w-full max-w-[440px] text-center">
        <Mark className="mx-auto size-10" />
        <p className="text-muted-foreground mt-8 text-[13px] tabular-nums">404</p>
        <h1 className="mt-1 text-[32px] leading-[38px] font-normal tracking-[-0.02em]">This page doesn&apos;t exist</h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-[22rem] text-[15px] leading-6">
          The link may be old, or the address mistyped. Everything in {appConfig.name} starts from the home page or your portal.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button render={<Link href="/portal" />}>
            <LayoutDashboard /> Open the console
          </Button>
          <Button variant="outline" render={<Link href="/products" />}>
            <Rows3 /> Products
          </Button>
        </div>
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mt-6 inline-flex h-11 items-center gap-1.5 text-[13px] transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to the home page
        </Link>
      </div>
    </main>
  );
}
