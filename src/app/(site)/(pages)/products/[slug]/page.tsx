import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Note, SiteTitle } from "@/components/site/content-index";
import { ProductHeroArt } from "@/components/site/page-art";
import { Button } from "@/components/ui/button";
import { PRODUCT_DETAIL } from "@/lib/catalog";
import { getContent, type Content } from "@/server/content";
import { HttpError } from "@/server/policy";

/** The product, or null when it doesn't exist or isn't public (both answer 404). */
async function find(slug: string): Promise<Content | null> {
  try {
    const c = await getContent(null, slug);
    return c.kind === "product" ? c : null;
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return null;
    throw e;
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
  const detail = PRODUCT_DETAIL[product.slug ?? slug];

  return (
    <div className="space-y-12">
      <SiteTitle
          title={product.title}
          back={{ href: "/products", label: "All products" }}
          art={<ProductHeroArt slug={product.slug ?? slug} />}
          action={
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-7">
              <Button size="lg" className="h-11 px-5 text-[15px]" render={<Link href={`/connect?product=${encodeURIComponent(product.slug ?? slug)}`} />}>
                Request a demo <ArrowRight />
              </Button>
              <Link
                href="/login"
                className="hover:text-brand self-start rounded-sm text-[15px] font-medium text-white underline decoration-white/40 decoration-1 underline-offset-[6px] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand sm:self-auto"
              >
                Client sign in
              </Link>
            </div>
          }
        >
          {product.summary}
        </SiteTitle>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        {detail && (
          <section data-reveal aria-labelledby="does-title" className="bg-card shadow-card rounded-2xl border p-6 sm:p-8 lg:col-span-7">
            <h2 id="does-title" className="text-[22px] leading-[30px] tracking-[-0.02em]">What it does</h2>
            <ul className="mt-6 space-y-4">
              {detail.capabilities.map((c) => (
                <li key={c} className="flex gap-3.5 text-[16px] leading-[25px]">
                  <span className="bg-brand-soft text-primary grid size-7 shrink-0 place-items-center rounded-full">
                    <Check aria-hidden className="size-4" strokeWidth={2.5} />
                  </span>
                  {c}
                </li>
              ))}
            </ul>
            {product.body && <p className="text-muted-foreground mt-6 border-t pt-6 text-[15px] leading-6 whitespace-pre-line">{product.body}</p>}
          </section>
        )}
        <div className={detail ? "space-y-6 lg:col-span-5" : "grid gap-6 md:grid-cols-2 lg:col-span-12"}>
          {detail && (
            <section data-reveal aria-labelledby="for-title" className="bg-navy rounded-2xl p-6 text-white sm:p-7">
              <h2 id="for-title" className="text-brand text-[13px] font-semibold">Who it&apos;s for</h2>
              <p className="mt-2 text-[17px] leading-[26px]">{detail.audience}</p>
            </section>
          )}
          <Note label="for clients">
            Organisations that use {product.title} get a guided demo on synthetic data in the portal, and can share market
            observations about it privately with Azentio.
          </Note>
          <Note label="how feedback reaches the product">
            Observations are reviewed and de-identified before they&apos;re shared. When several organisations raise the
            same theme, the product team can turn it into an improvement idea with a status every contributor can follow.
          </Note>
        </div>
      </div>
    </div>
  );
}
