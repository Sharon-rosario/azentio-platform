"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { OFFERINGS } from "@/lib/products";

const KINDS = [
  { value: "broadcast", label: "Session or broadcast" },
  { value: "insight", label: "Insight" },
  { value: "experiment", label: "Experiment" },
  { value: "demo", label: "Demo" },
];
const AUDIENCES = [
  { value: "public", label: "Public: anyone, signed in or not" },
  { value: "employee", label: "Employees only" },
  { value: "client", label: "Clients (entitled to the product, if one is set)" },
];
const NO_PRODUCT = "none";
const PRODUCTS = [{ value: NO_PRODUCT, label: "No product" }, ...OFFERINGS];

/** Publishers create content; the audience field decides who can read it, and the server applies it on every request. */
export function ContentForm() {
  const router = useRouter();
  const id = useId();
  const [kind, setKind] = useState("broadcast");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [audience, setAudience] = useState("employee");
  const [product, setProduct] = useState(NO_PRODUCT);
  const [startsAt, setStartsAt] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/content", "POST", {
        kind,
        title,
        summary,
        audience,
        product: product === NO_PRODUCT ? null : product,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      });
      toast.success("Published");
      setTitle("");
      setSummary("");
      setStartsAt("");
      router.refresh();
    } catch {
      // toast already shown
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Labelled id={`${id}-kind`} label="Type">
        <Select items={KINDS} value={kind} onValueChange={(v) => v && setKind(v)}>
          <SelectTrigger id={`${id}-kind`} className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
        </Select>
      </Labelled>
      <Labelled id={`${id}-title`} label="Title">
        <Input id={`${id}-title`} required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} className="h-10" />
      </Labelled>
      <Labelled id={`${id}-summary`} label="Summary">
        <Textarea id={`${id}-summary`} required maxLength={1000} value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Labelled>
      <Labelled id={`${id}-audience`} label="Audience" hint="Audience decides who can see it; the server enforces it on every request.">
        <Select items={AUDIENCES} value={audience} onValueChange={(v) => v && setAudience(v)}>
          <SelectTrigger id={`${id}-audience`} className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{AUDIENCES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
        </Select>
      </Labelled>
      <Labelled id={`${id}-product`} label="Product" optional>
        <Select items={PRODUCTS} value={product} onValueChange={(v) => v && setProduct(v)}>
          <SelectTrigger id={`${id}-product`} className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{PRODUCTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </Labelled>
      <Labelled id={`${id}-starts`} label="Starts" optional>
        <Input id={`${id}-starts`} type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="h-10" />
      </Labelled>
      <div>
        <Button type="submit" loading={busy} disabled={!title.trim() || !summary.trim()}>
          <Plus /> {busy ? "Publishing…" : "Publish"}
        </Button>
      </div>
    </form>
  );
}

function Labelled({ id, label, hint, optional, children }: { id: string; label: string; hint?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
        {optional && <span className="text-muted-foreground ml-1.5 font-normal">Optional</span>}
      </label>
      {children}
      {hint && <p className="text-muted-foreground text-[12px]">{hint}</p>}
    </div>
  );
}
