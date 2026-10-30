"use client";

import { Flag, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { FormDialog, TextareaField } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const reasonSchema = z.object({ reason: z.string().trim().min(5, "Say what's wrong (at least 5 characters)").max(1000) });

/** A client reports a shared copy. It's hidden from the feed while a moderator looks. */
export function ReportButton({ sharedId, title }: { sharedId: number; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label={`Report “${title}”`}>
        <Flag /> Report
      </Button>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title="Report this shared item"
        description="It's hidden from shared learning while a moderator looks. Other clients don't see who reported it."
        schema={reasonSchema}
        defaultValues={{ reason: "" }}
        submitLabel="Report"
        busyLabel="Reporting…"
        onSubmit={async (v) => {
          await api(`/api/shared/${sharedId}/report`, "POST", v);
          toast.success("Reported. It's hidden while a moderator looks.");
          router.refresh();
        }}
      >
        {(form) => (
          <TextareaField
            form={form}
            name="reason"
            label="What's wrong with it?"
            maxLength={1000}
            description="For example: it names a customer, or it looks like confidential pricing."
          />
        )}
      </FormDialog>
    </>
  );
}

const noteSchema = z.object({ note: z.string().trim().min(3, "Add a short note for the record").max(1000) });

/** A moderator closes a report: put the copy back, or take it down for good. */
export function ReportDecision({ reportId, title }: { reportId: number; title: string }) {
  const router = useRouter();
  const [decision, setDecision] = useState<"restore" | "remove" | null>(null);
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setDecision("restore")}>
          <RotateCcw /> Restore
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setDecision("remove")}>
          <Trash2 /> Remove
        </Button>
      </div>
      <FormDialog
        open={decision !== null}
        onOpenChange={(o) => !o && setDecision(null)}
        title={decision === "remove" ? "Remove this shared copy?" : "Restore this shared copy?"}
        description={
          decision === "remove"
            ? `“${title}” is taken out of shared learning for good. The author is told.`
            : `“${title}” goes back into shared learning as it was. The author is told it was reviewed.`
        }
        schema={noteSchema}
        defaultValues={{ note: "" }}
        submitLabel={decision === "remove" ? "Remove" : "Restore"}
        busyLabel="Saving…"
        onSubmit={async (v) => {
          await api(`/api/reports/${reportId}`, "POST", { decision, note: v.note });
          toast.success(decision === "remove" ? "Removed from shared learning" : "Restored to shared learning");
          router.refresh();
        }}
      >
        {(form) => <TextareaField form={form} name="note" label="Note for the record" maxLength={1000} />}
      </FormDialog>
    </>
  );
}
