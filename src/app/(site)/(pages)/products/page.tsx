import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SiteTitle } from "@/components/site/content-index";
import { OfferingGrid } from "@/components/site/product-art";
import { Button } from "@/components/ui/button";
import { listContent } from "@/server/content";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  const products = await listContent(null, "product");
  return (
    <div className="space-y-12">
      <SiteTitle
        title="Products for every step of a credit decision."
        highlight="credit decision."
        action={<Button size="lg" className="h-11 px-5 text-[15px]" render={<Link href="/connect" />}>Request a demo <ArrowRight /></Button>}
      >
        Credit, risk and reporting software for banks and lenders. Clients see guided demos of the products they use
        inside the portal.
      </SiteTitle>
      <OfferingGrid
        items={[...products]
          .filter((p) => p.slug)
          .sort((a, b) => a.title.localeCompare(b.title))
          .map((p) => ({ slug: p.slug!, href: `/products/${p.slug}`, kind: "Product" as const, title: p.title, summary: p.summary }))}
      />
    </div>
  );
}
