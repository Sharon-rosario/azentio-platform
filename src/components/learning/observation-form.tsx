"use client";

import { Building2, Lock, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Banner } from "@/components/banner";
import { RadioCardsField, SelectField, TextareaField, TextField, zodResolver } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { OFFERINGS } from "@/lib/products";

const schema = z.object({
  title: z.string().trim().min(1, "Give it a short title").max(140, "Keep the title under 140 characters"),
  body: z.string().trim().min(1, "Describe what you observed").max(4000, "Keep it under 4,000 characters"),
  category: z.string({ error: "Choose a category" }).min(1, "Choose a category"),
  offering: z.string({ error: "Choose the offering it relates to" }).min(1, "Choose the offering it relates to"),
  period: z.string().trim().min(1, "When did you see this? For example Q3 2026").max(60, "Keep it under 60 characters"),
  evidence_type: z.string().trim().min(1, "Say what it's based on").max(80, "Keep it under 80 characters"),
  confidence: z.string({ error: "Choose how confident you are" }).min(1, "Choose how confident you are"),
  visibility: z.enum(["private", "organisation", "community"]),
});

type Values = z.input<typeof schema>;

export type ObservationFormProps = {
  categories: readonly string[];
  confidence: readonly string[];
  orgName: string;
  /** Edit mode: the observation being changed. */
  edit?: { id: number; status: string; visibility: string; values: Omit<Values, "visibility"> };
};

export function ObservationForm({ categories, confidence, orgName, edit }: ObservationFormProps) {
  const router = useRouter();
  // Community visibility only ever comes from submit + moderation, so it isn't offered when editing.
  const lockedCommunity = edit?.visibility === "community";
  const form = useForm<Values, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: edit
      ? { ...edit.values, visibility: edit.visibility as Values["visibility"] }
      : { title: "", body: "", category: undefined, offering: undefined, period: "", evidence_type: "", confidence: undefined, visibility: "private" },
  });
  const busy = form.formState.isSubmitting;
  const community = useWatch({ control: form.control, name: "visibility" }) === "community";

  const submit = form.handleSubmit(async (v) => {
    if (edit) {
      const { visibility, ...rest } = v;
      await api(`/api/observations/${edit.id}`, "PATCH", lockedCommunity ? rest : { ...rest, visibility });
      toast.success(edit.status === "published" ? "Saved and sent back to a moderator for review" : "Changes saved");
      router.push(`/portal/observations/${edit.id}`);
      router.refresh();
      return;
    }
    // Proposing for the community is a separate, explicit step with its own permissions. Save privately first.
    const { id } = await api<{ id: number }>("/api/observations", "POST", { ...v, visibility: community ? "private" : v.visibility });
    toast.success(community ? "Saved privately. Next, choose what you allow before it's proposed." : "Observation saved");
    router.push(`/portal/observations/${id}${community ? "?share=1" : ""}`);
    router.refresh();
  });

  const visibilityOptions = [
    { value: "private", label: "Only me", icon: Lock, description: "A private draft. No one else can open it, including Azentio." },
    { value: "organisation", label: "My organisation", icon: Building2, description: `Colleagues at ${orgName} can read it. It never leaves your organisation.` },
    ...(edit
      ? []
      : [{ value: "community", label: "Propose for the learning community", icon: Users,
          description: "Needs your permission and a moderator's review. Only a de-identified copy is ever published." }]),
  ];

  return (
    <form onSubmit={(e) => void submit(e).catch(() => {})} noValidate className="grid gap-5">
      <Banner tone="warning" title="Keep it de-identified">
        Don&apos;t include customer names, account numbers, transaction-level data, credentials or confidential terms.
        Describe the pattern, not the people or accounts behind it.
      </Banner>

      <TextField form={form} name="title" label="Title" maxLength={140} placeholder="Seasonal revenue dips read as distress" />
      <TextareaField
        form={form}
        name="body"
        label="Observation"
        maxLength={4000}
        rows={6}
        description="What did you see, how often, and what effect did it have?"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField form={form} name="category" label="Category" options={categories.map((c) => ({ value: c, label: c }))} />
        <SelectField form={form} name="offering" label="Offering" options={OFFERINGS} />
        <TextField form={form} name="period" label="Observation period" maxLength={60} placeholder="Q3 2026" />
        <TextField
          form={form}
          name="evidence_type"
          label="Evidence type"
          maxLength={80}
          placeholder="Portfolio review"
          description="What it's based on: a portfolio review, pilot results, underwriter feedback…"
        />
        <SelectField form={form} name="confidence" label="Confidence" options={confidence.map((c) => ({ value: c, label: c }))} />
      </div>

      {lockedCommunity ? (
        <Banner tone="info" title="Proposed for the learning community">
          Who can see it doesn&apos;t change when you edit. To stop sharing it, withdraw it instead.
        </Banner>
      ) : (
        <div className="grid gap-2">
          <RadioCardsField form={form} name="visibility" label="Who can see it" options={visibilityOptions} columns={edit ? 2 : 3} />
          <p className="text-muted-foreground text-[12px] leading-[18px]">
            Saving never shares anything with other organisations.
            {community && " It's saved privately first; on the next screen you choose what you allow and send it to a moderator."}
          </p>
        </div>
      )}

      {edit?.status === "published" && (
        <Banner tone="warning" title="Saving sends this back for review">
          A moderator reviews the new version before it&apos;s shared. The copy that&apos;s live now stays up until they publish the
          new one, or until you withdraw it.
        </Banner>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" render={<Link href={edit ? `/portal/observations/${edit.id}` : "/portal/observations"} />}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          {busy
            ? "Saving…"
            : edit
              ? edit.status === "published" ? "Save and send for review" : "Save changes"
              : community ? "Save and continue" : "Save observation"}
        </Button>
      </div>
    </form>
  );
}
