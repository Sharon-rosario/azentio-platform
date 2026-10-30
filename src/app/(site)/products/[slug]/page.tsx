import { ArrowLeft, ArrowRight, LogIn } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Panel } from "@/components/states";
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
    <div className="space-y-6">
      <Link
        href="/products"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-[13px] outline-none focus-visible:underline"
      >
        <ArrowLeft className="size-3.5" /> All products
      </Link>

      <section className="bg-card rounded-2xl px-6 py-10 sm:px-10">
        <h1 className="max-w-2xl text-[32px] leading-[38px] font-medium tracking-[-0.02em] text-balance">{product.title}</h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-[15px] leading-6">{product.summary}</p>
        {product.body && <p className="mt-4 max-w-2xl text-[15px] leading-6 whitespace-pre-line">{product.body}</p>}
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button render={<Link href={`/connect?product=${encodeURIComponent(product.slug ?? slug)}`} />}>
            Request a demo <ArrowRight />
          </Button>
          <Button variant="outline" render={<Link href="/login" />}>
            <LogIn /> Client sign in
          </Button>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <Panel title="For clients" description="In the azentio.ai portal">
          <p className="text-[14px] leading-[22px]">
            Organisations that use {product.title} get a guided demo on synthetic data, and can share market observations
            about it privately with Azentio.
          </p>
        </Panel>
        <Panel title="How feedback reaches the product" description="Governed, shared learning">
          <p className="text-[14px] leading-[22px]">
            Observations are reviewed and de-identified before they&apos;re shared. When several organisations raise the same
            theme, the product team can turn it into an improvement idea with a status every contributor can follow.
          </p>
        </Panel>
      </div>
    </div>
  );
}
