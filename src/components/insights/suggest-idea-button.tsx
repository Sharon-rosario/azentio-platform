"use client";

import { Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { FormDialog, SelectField, TextareaField, TextField } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { OFFERINGS } from "@/lib/products";

const NO_THEME = "none";

const schema = z.object({
  title: z.string().trim().min(3, "Give it a short title").max(160),
  problem: z.string().trim().min(10, "Describe what you've seen in a sentence or two").max(2000),
  offering: z.string().min(1, "Choose the product it's about"),
  theme: z.string(),
});

/** An employee's improvement suggestion. It stays internal until a product owner publishes it to clients. */
export function SuggestIdeaButton({ themes }: { themes: { id: number; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Lightbulb /> Suggest an improvement
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Suggest an improvement"
        description="It stays internal: product owners review it, and clients only see it if one of them publishes it."
        schema={schema}
        defaultValues={{ title: "", problem: "", offering: "", theme: NO_THEME }}
        submitLabel="Send suggestion"
        busyLabel="Sending…"
        onSubmit={async (v) => {
          await api("/api/ideas/suggestions", "POST", {
            title: v.title, problem: v.problem, offering: v.offering, theme_id: v.theme === NO_THEME ? null : Number(v.theme),
          });
          toast.success("Suggestion sent to the product owners");
          router.refresh();
        }}
      >
        {(form) => (
          <>
            <TextField form={form} name="title" label="Title" maxLength={160} />
            <TextareaField form={form} name="problem" label="What you've seen" description="The problem, and who runs into it." maxLength={2000} />
            <SelectField form={form} name="offering" label="Product" options={OFFERINGS} />
            <SelectField form={form} name="theme" label="Theme" description="Optional: a theme with enough evidence behind it."
              options={[{ value: NO_THEME, label: "No theme" }, ...themes.map((t) => ({ value: String(t.id), label: t.name }))]} />
          </>
        )}
      </FormDialog>
    </>
  );
}
