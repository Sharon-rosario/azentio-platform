import type { Metadata } from "next";
import Link from "next/link";

import { EntryIndex, SiteTitle } from "@/components/site/content-index";
import { listContent } from "@/server/content";

export const metadata: Metadata = { title: "Solutions" };

export default async function SolutionsPage() {
  const solutions = await listContent(null, "solution");
  return (
    <div className="space-y-12">
      <SiteTitle
        title="Solutions"
        action={
          <Link href="/products" className="hover:text-primary rounded-sm text-[15px] font-medium underline decoration-1 underline-offset-[6px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring">
            See the products
          </Link>
        }
      >
        The problems our products solve together, across lending, documents and governed AI.
      </SiteTitle>
      <EntryIndex items={solutions} empty="No solutions are listed yet." />
    </div>
  );
}
