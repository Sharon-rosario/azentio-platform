"use client";

import { Pencil, Send, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { confirm } from "@/components/confirm";
import { CheckboxField, FormDialog } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const consentSchema = z.object({
  publish: z.boolean().refine((v) => v, "Sharing with the community needs this. Without it, the observation stays where it is."),
  attribute: z.boolean(),
  train: z.boolean(),
});

/** The author's actions on one observation. The server re-checks every one of them. */
export function ObservationActions({
  id,
  canEdit,
  canSubmit,
  canWithdraw,
  inReview,
  openSubmit = false,
}: {
  id: number;
  canEdit: boolean;
  canSubmit: boolean;
  canWithdraw: boolean;
  inReview: boolean;
  openSubmit?: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(openSubmit && canSubmit);

  const withdraw = () =>
    confirm({
      title: "Withdraw this observation?",
      description: (
        <>
          {inReview && "It leaves the moderation queue. "}Any shared copy is removed from the shared learning feed, search and AIRA
          summaries within seconds, and your permission to publish is recorded as withdrawn. It can&apos;t recall copies people have
          already read. This can&apos;t be undone: to share again, write a new observation.
        </>
      ),
      confirmLabel: "Withdraw",
      busyLabel: "Withdrawing…",
      tone: "danger",
      onConfirm: async () => {
        await api(`/api/observations/${id}/withdraw`, "POST");
        toast.success("Withdrawn. It's no longer in shared learning.");
        router.refresh();
      },
    });

  if (!canEdit && !canSubmit && !canWithdraw) return null;

  return (
    <>
      {canEdit && (
        <Button variant="outline" render={<Link href={`/portal/observations/${id}/edit`} />}>
          <Pencil /> Edit
        </Button>
      )}
      {canWithdraw && (
        <Button variant="outline" onClick={withdraw}>
          <Undo2 /> Withdraw
        </Button>
      )}
      {canSubmit && (
        <Button onClick={() => setSubmitting(true)}>
          <Send /> Submit for community sharing
        </Button>
      )}
      <FormDialog
        open={submitting}
        onOpenChange={(o) => {
          setSubmitting(o);
          if (!o && openSubmit) router.replace(`/portal/observations/${id}`, { scroll: false });
        }}
        wide
        title="Submit for community sharing"
        description="A learning moderator at Azentio reviews it first. Nothing is shared until they publish a reviewed, de-identified copy."
        schema={consentSchema}
        defaultValues={{ publish: false, attribute: false, train: false }}
        submitLabel="Submit for review"
        busyLabel="Submitting…"
        onSubmit={async (v) => {
          await api(`/api/observations/${id}/submit`, "POST", v);
          toast.success("Submitted. A moderator will review it.");
          router.replace(`/portal/observations/${id}`, { scroll: false });
          router.refresh();
        }}
      >
        {(form) => (
          <>
            <p className="text-muted-foreground text-[13px] leading-5">
              Being a member of the learning community isn&apos;t consent. Each permission below is separate and applies only to
              this observation. To change them later, withdraw it: that revokes publishing and removes any shared copy.
            </p>
            <CheckboxField
              form={form}
              name="publish"
              label="Publish a reviewed, de-identified copy to the learning community"
              description="Required. A moderator removes anything that identifies your organisation or customers. Your original stays private."
            />
            <CheckboxField
              form={form}
              name="attribute"
              label="Show my organisation's name with it"
              description="Optional. Without it the copy is shown as “De-identified”. The moderator can still choose not to show it."
            />
            <CheckboxField
              form={form}
              name="train"
              label="Allow use in future model-training programmes"
              description="Optional and separate from sharing. Saying no doesn't affect whether it's published."
            />
          </>
        )}
      </FormDialog>
    </>
  );
}
