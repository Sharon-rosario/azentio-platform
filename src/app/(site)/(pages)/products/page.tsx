import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ProductGrid } from "@/components/site/content-cards";
import { PageHeader } from "@/components/states";
import { Button } from "@/components/ui/button";
import { listContent } from "@/server/content";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  const products = await listContent(null, "product");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Credit, risk and reporting software for banks and lenders. Clients see guided demos of the products they use in the portal."
        actions={<Button render={<Link href="/connect" />}>Request a demo <ArrowRight /></Button>}
      />
      <ProductGrid products={products} />
    </div>
  );
}
