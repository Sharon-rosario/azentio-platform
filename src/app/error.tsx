"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";

import { Mark } from "@/components/brand";
import { Button } from "@/components/ui/button";

/** Anything a page throws that isn't a 404 or a refusal: say so plainly and offer a retry. No error detail is shown. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-16">
      <div className="w-full max-w-[440px] text-center">
        <Mark className="mx-auto size-10" />
        <p className="text-muted-foreground mt-8 text-[13px]">Something went wrong</p>
        <h1 className="mt-1 text-[32px] leading-[38px] font-semibold tracking-[-0.02em]">This page couldn&apos;t load</h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-[22rem] text-[15px] leading-6">
          The problem is on our side, not yours. Nothing you entered was lost; try again in a moment.
        </p>
        <div className="mt-8 flex justify-center">
          <Button onClick={reset}>
            <RotateCcw /> Try again
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
