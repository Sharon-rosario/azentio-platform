"use client";

import { Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { ChoiceField, FormDialog, TextareaField, TextField } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const schema = z.object({
  title: z.string().trim().min(3, "Give the idea a short title").max(160),
  problem: z.string().trim().min(10, "Describe the problem in a sentence or two").max(2000),
  proposed_outcome: z.string().trim().min(5, "Say what should change for clients").max(2000),
  owner: z.string().trim().min(2, "Name the owner or team").max(120),
  priority: z.enum(["Low", "Medium", "High"]),
});

const PRIORITIES = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
] as const;

/** Turn a theme into an improvement idea. Offering and theme come from the theme; the server checks it has enough evidence. */
export function CreateIdeaButton({ themeId, themeName, offering }: { themeId: number; themeName: string; offering: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Lightbulb /> Create improvement idea
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        wide
        title="New improvement idea"
        description={`Linked to "${themeName}". Clients behind this theme see the title, status and public note, never the internal fields.`}
        schema={schema}
        defaultValues={{ title: "", problem: "", proposed_outcome: "", owner: "", priority: "Medium" }}
        submitLabel="Create idea"
        busyLabel="Creating…"
        onSubmit={async (v) => {
          await api("/api/ideas", "POST", { ...v, offering, theme_id: themeId });
          toast.success("Improvement idea created");
          router.refresh();
        }}
      >
        {(form) => (
          <>
            <TextField form={form} name="title" label="Title" maxLength={160} />
            <TextareaField form={form} name="problem" label="Problem" description="What clients are running into. Internal only." maxLength={2000} />
            <TextareaField form={form} name="proposed_outcome" label="Proposed outcome" description="What should be different once this ships. Internal only." maxLength={2000} />
            <TextField form={form} name="owner" label="Owner or team" placeholder="e.g. SME Credit product team" />
            <ChoiceField form={form} name="priority" label="Priority" options={PRIORITIES} />
          </>
        )}
      </FormDialog>
    </>
  );
}
