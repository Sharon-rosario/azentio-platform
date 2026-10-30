"use client";

import { CircleCheck, CornerUpLeft, Send, TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { confirm } from "@/components/confirm";
import { FormDialog, SelectField, TextareaField, TextField, zodResolver } from "@/components/form-dialog";
import { Panel } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const NO_THEME = "none";

const schema = z.object({
  title: z.string().trim().min(1, "The shared copy needs a title").max(140, "Keep the title under 140 characters"),
  body: z.string().trim().min(1, "The shared copy needs a text").max(4000, "Keep it under 4,000 characters"),
  period: z.string().trim().min(1, "Add a period, even a broad one").max(60),
  region: z.string().trim().min(1, "Add a region, even a broad one").max(80),
  industry: z.string().trim().min(1, "Add an industry, even a broad one").max(80),
  theme: z.string(),
  attribute: z.boolean(),
});

const noteSchema = z.object({ note: z.string().trim().min(5, "Tell the author why (at least 5 characters)").max(1000) });

/** The moderator's editable copy. What's published is only these fields; the original is never shown to other clients. */
export function ReviewForm({
  id,
  original,
  flags,
  themes,
  attributionAllowed,
  org,
}: {
  id: number;
  original: { title: string; body: string; period: string; region: string; industry: string };
  flags: { kind: string; match: string }[];
  themes: { id: number; name: string }[];
  attributionAllowed: boolean;
  org: string;
}) {
  const router = useRouter();
  const [sendBack, setSendBack] = useState<"return" | "reject" | null>(null);
  const form = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    // Industry and region start general: an exact one can point at the contributor when only a few organisations take part.
    defaultValues: { ...original, industry: "Financial services", region: "Not disclosed", theme: NO_THEME, attribute: false },
  });
  const busy = form.formState.isSubmitting;
  const [title, body, attribute] = useWatch({ control: form.control, name: ["title", "body", "attribute"] });
  const copy = `${title}\n${body}`;
  const remaining = flags.filter((f) => copy.includes(f.match));

  const publish = form.handleSubmit(async (v) => {
    await confirm({
      title: "Publish this reviewed copy?",
      description:
        "Every client organisation in the learning community will be able to read it. Only the fields on the right are published; the author's original stays private.",
      confirmLabel: "Publish",
      busyLabel: "Publishing…",
      onConfirm: async () => {
        await api(`/api/moderation/${id}`, "POST", {
          decision: "publish",
          title: v.title,
          body: v.body,
          period: v.period,
          region: v.region,
          industry: v.industry,
          theme_id: v.theme === NO_THEME ? null : Number(v.theme),
          attribute: attributionAllowed && v.attribute,
        });
        toast.success("Published to shared learning");
        router.push("/portal/moderation");
        router.refresh();
      },
    });
  });

  return (
    <Panel title="Reviewed copy" description="This is what other organisations will read. Edit out anything identifying.">
      <form onSubmit={(e) => void publish(e)} noValidate className="grid gap-5">
        {flags.length > 0 && (
          <div
            className={cn("border-l-2 px-4 py-3 text-[14px] leading-5", remaining.length ? "border-warning bg-warning-soft" : "border-success bg-success-soft")}
            role="status"
          >
            <p className="flex items-center gap-2 text-[14px] font-medium">
              {remaining.length ? <TriangleAlert className="text-warning size-4" /> : <CircleCheck className="text-success size-4" />}
              {remaining.length
                ? `${remaining.length} flagged ${remaining.length === 1 ? "match is" : "matches are"} still in the copy`
                : "All flagged matches are out of the copy"}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {flags.map((f) => {
                const left = remaining.includes(f);
                return (
                  <li key={f.match} className={cn("flex gap-2", !left && "text-muted-foreground line-through")}>
                    <span className="min-w-0 break-all">
                      {f.kind}: <span className="font-mono">{f.match}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <TextField form={form} name="title" label="Title" maxLength={140} />
        <TextareaField form={form} name="body" label="Text" maxLength={4000} rows={8} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField form={form} name="period" label="Period" description="Broaden it if it narrows down who wrote it." />
          <TextField form={form} name="region" label="Region"
            description={`The organisation's is ${original.region}. Name a wide region only when several organisations share it.`} />
          <TextField form={form} name="industry" label="Industry"
            description={`The organisation's is ${original.industry}. Keep it general unless the organisation is named.`} />
        </div>
        <SelectField
          form={form}
          name="theme"
          label="Theme"
          description="Groups this copy with others on the same topic. A theme stays hidden until enough organisations contribute."
          options={[{ value: NO_THEME, label: "No theme" }, ...themes.map((t) => ({ value: String(t.id), label: t.name }))]}
        />

        <div className="flex items-start gap-3">
          <Checkbox
            id="review-attribute"
            checked={attributionAllowed && !!attribute}
            onCheckedChange={(v) => form.setValue("attribute", v === true, { shouldDirty: true })}
            disabled={!attributionAllowed}
            className="mt-0.5 size-[18px]"
          />
          <div className="grid gap-1">
            <label htmlFor="review-attribute" className={cn("text-[14px] leading-5", !attributionAllowed && "text-muted-foreground")}>
              Show the organisation name ({org})
            </label>
            <p className="text-muted-foreground text-[12px] leading-[18px]">
              {attributionAllowed
                ? "The author allowed this. Leave it off if the name plus the details would point to a specific customer."
                : "The author didn't allow it, so the copy is published as “De-identified”."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          <Button type="button" variant="ghost" disabled={busy} onClick={() => setSendBack("reject")}>
            <X /> Decline with note
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => setSendBack("return")}>
            <CornerUpLeft /> Return with note
          </Button>
          <Button type="submit" loading={busy}>
            <Send /> Publish
          </Button>
        </div>
      </form>

      <FormDialog
        open={sendBack !== null}
        onOpenChange={(o) => !o && setSendBack(null)}
        title={sendBack === "reject" ? "Decline this contribution?" : "Return it to the author?"}
        description={
          sendBack === "reject"
            ? "Nothing is published. The author sees your note and the contribution stays with them."
            : "Nothing is published. The author sees your note, can change it and submit again."
        }
        schema={noteSchema}
        defaultValues={{ note: "" }}
        submitLabel={sendBack === "reject" ? "Decline" : "Return to author"}
        busyLabel="Sending…"
        onSubmit={async (v) => {
          await api(`/api/moderation/${id}`, "POST", { decision: sendBack, note: v.note });
          toast.success(sendBack === "reject" ? "Declined. The author has been told." : "Returned to the author");
          router.push("/portal/moderation");
          router.refresh();
        }}
      >
        {(f) => (
          <TextareaField
            form={f}
            name="note"
            label="Note to the author"
            maxLength={1000}
            description="Be specific: what to change, or why it can't be shared."
          />
        )}
      </FormDialog>
    </Panel>
  );
}
