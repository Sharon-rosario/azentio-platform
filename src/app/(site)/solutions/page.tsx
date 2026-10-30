import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ContentCard } from "@/components/site/content-cards";
import { EmptyState, PageHeader } from "@/components/states";
import { Button } from "@/components/ui/button";
import { listContent } from "@/server/content";

export const metadata: Metadata = { title: "Solutions" };

export default async function SolutionsPage() {
  const solutions = await listContent(null, "solution");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Solutions"
        description="The problems our products solve together, across lending, documents and governed AI."
        actions={<Button variant="outline" render={<Link href="/products" />}>See products <ArrowRight /></Button>}
      />
      {solutions.length ? (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {solutions.map((s) => (
            <li key={s.id}>
              <ContentCard item={s} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="bg-card rounded-2xl">
          <EmptyState title="No solutions listed yet" />
        </div>
      )}
    </div>
  );
}
