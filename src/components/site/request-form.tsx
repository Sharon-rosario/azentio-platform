"use client";

import { CircleCheck, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { OFFERINGS, PRODUCT_NAME } from "@/lib/products";

const MAX_MESSAGE = 1800; // the API allows 2000; leave room for the product line we prepend

type Kind = "demo" | "hackathon";

const COPY: Record<Kind, { company: string; message: string; placeholder: string; submit: string; done: string }> = {
  demo: {
    company: "Company",
    message: "What would you like to see?",
    placeholder: "For example: how a credit policy change affects approvals on a portfolio like ours.",
    submit: "Request a demo",
    done: "Thanks, we'll be in touch.",
  },
  hackathon: {
    company: "Organisation, team or university",
    message: "What would you like to build?",
    placeholder: "A sentence or two about your idea or the skills on your team.",
    submit: "Register interest",
    done: "Thanks, you're on the list.",
  },
};

/** Public request form (demo or hackathon). The server validates and stores it; nothing is emailed in this demo. */
export function RequestForm({ kind, defaultProduct }: { kind: Kind; defaultProduct?: string | null }) {
  const copy = COPY[kind];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [product, setProduct] = useState<string | null>(defaultProduct && PRODUCT_NAME[defaultProduct] ? defaultProduct : null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef<HTMLHeadingElement>(null);
  // Screen-reader and keyboard users land on the confirmation instead of a form that has gone.
  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      // The request record has no product column, so the chosen product travels at the top of the message.
      const text = [product ? `Product: ${PRODUCT_NAME[product]}` : "", message.trim()].filter(Boolean).join("\n\n");
      await api("/api/requests", "POST", { kind, name, email, company: company || undefined, message: text || undefined });
      setDone(true);
    } catch {
      // api() already showed the server's message as a toast
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const back = kind === "demo" ? { href: "/products", label: "Back to products" } : { href: "/", label: "Back to the home page" };
    return (
      <div className="flex flex-col items-center py-10 text-center" role="status">
        <span className="bg-success-soft grid size-12 place-items-center rounded-full">
          <CircleCheck className="text-success size-5" strokeWidth={1.75} />
        </span>
        <h2 ref={doneRef} tabIndex={-1} className="mt-4 text-[20px] leading-7 font-medium tracking-[-0.01em] outline-none">{copy.done}</h2>
        <p className="text-muted-foreground mt-2 max-w-sm text-[14px] leading-[22px]">
          We don&apos;t send a confirmation email from this demo.
        </p>
        <Button variant="outline" className="mt-6" render={<Link href={back.href} />}>
          {back.label}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Name">
          <Input id="name" autoComplete="name" required minLength={2} maxLength={120} value={name}
            onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field id="email" label="Work email">
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="company" label={copy.company} optional>
          <Input id="company" autoComplete="organization" maxLength={160} value={company} onChange={(e) => setCompany(e.target.value)} />
        </Field>
        {kind === "demo" && (
          <Field id="product" label="Product" optional>
            <Select items={OFFERINGS} value={product} onValueChange={(v) => setProduct((v as string | null) ?? null)}>
              <SelectTrigger id="product" className="w-full">
                <SelectValue placeholder="Choose a product" />
              </SelectTrigger>
              <SelectContent>
                {OFFERINGS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </div>
      <Field id="message" label={copy.message} optional>
        <Textarea id="message" rows={4} maxLength={MAX_MESSAGE} value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder={copy.placeholder} className="min-h-28" />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-muted-foreground text-[12px]">Use synthetic details: this is a demo environment.</p>
        <Button type="submit" loading={busy}>
          <Send /> {busy ? "Sending…" : copy.submit}
        </Button>
      </div>
    </form>
  );
}

function Field({ id, label, optional, children }: { id: string; label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium">
        {label}
        {optional && <span className="text-muted-foreground font-normal"> (optional)</span>}
      </label>
      {children}
    </div>
  );
}
