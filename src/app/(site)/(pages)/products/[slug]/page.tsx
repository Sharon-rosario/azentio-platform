import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Note, SiteTitle } from "@/components/site/content-index";
import { Button } from "@/components/ui/button";
import { getContent, type Content } from "@/server/content";

/** The product, or null when it doesn't exist or isn't public (both answer 404). */
async function find(slug: string): Promise<Content | null> {
  try {
    const c = await getContent(null, slug);
    return c.kind === "product" ? c : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await find((await params).slug);
  return { title: product?.title ?? "Product not found", description: product?.summary };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await find(slug);
  if (!product) notFound();

  return (
    <div className="space-y-12">
      <div className="space-y-8">
        <Link
          href="/products"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-sm text-[14px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" /> All products
        </Link>
        <SiteTitle
          title={product.title}
          action={
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7 lg:flex-row-reverse">
              <Button size="lg" className="h-11 px-5 text-[15px]" render={<Link href={`/connect?product=${encodeURIComponent(product.slug ?? slug)}`} />}>
                Request a demo <ArrowRight />
              </Button>
              <Link
                href="/login"
                className="hover:text-primary self-start rounded-sm text-[15px] font-medium underline decoration-1 underline-offset-[6px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring sm:self-auto"
              >
                Client sign in
              </Link>
            </div>
          }
        >
          {product.summary}
        </SiteTitle>
      </div>

      <div className="grid gap-10 md:grid-cols-12 md:gap-6">
        {product.body && <p className="text-[17px] leading-[27px] whitespace-pre-line md:col-span-7">{product.body}</p>}
        <Note label="for clients" className={product.body ? "md:col-span-4 md:col-start-9" : "md:col-span-5"}>
          Organisations that use {product.title} get a guided demo on synthetic data in the portal, and can share market
          observations about it privately with Azentio.
        </Note>
        <Note label="how feedback reaches the product" className={product.body ? "md:col-span-4 md:col-start-9" : "md:col-span-5 md:col-start-7"}>
          Observations are reviewed and de-identified before they&apos;re shared. When several organisations raise the
          same theme, the product team can turn it into an improvement idea with a status every contributor can follow.
        </Note>
      </div>
    </div>
  );
}
