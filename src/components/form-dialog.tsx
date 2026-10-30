"use client";

import { useState, type ReactNode } from "react";
import { useForm, type DefaultValues, type FieldValues, type UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import { Banner } from "@/components/banner";
import { zodResolver } from "@/components/form/resolver";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * A modal form: validated with zod, submit button shows progress, server errors appear inside the
 * dialog (it stays open so nothing typed is lost), and the form resets each time it opens.
 *
 *   <FormDialog open={open} onOpenChange={setOpen} title="New application" schema={schema}
 *     defaultValues={{ name: "" }} submitLabel="Create" onSubmit={(v) => create.mutateAsync(v)}>
 *     {(form) => <TextField form={form} name="name" label="Applicant" />}
 *   </FormDialog>
 */
type FormDialogProps<S extends z.ZodType<FieldValues, FieldValues>> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  schema: S;
  defaultValues: DefaultValues<z.input<S>>;
  onSubmit: (values: z.output<S>) => Promise<unknown>;
  submitLabel?: string;
  busyLabel?: string;
  wide?: boolean;
  /** "center" (default) for forms and decisions; "top" for quick entry that should not cover the page. */
  position?: "center" | "top";
  children: (form: UseFormReturn<z.input<S>, unknown, z.output<S>>) => ReactNode;
};

export function FormDialog<S extends z.ZodType<FieldValues, FieldValues>>(props: FormDialogProps<S>) {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={props.open} onOpenChange={(o) => !busy && props.onOpenChange(o)}>
      <DialogContent position={props.position} className={cn(props.wide && "sm:max-w-xl")}>
        {/* The content unmounts on close, so each open starts with fresh values and no old error. */}
        <FormBody {...props} setBusy={setBusy} />
      </DialogContent>
    </Dialog>
  );
}

function FormBody<S extends z.ZodType<FieldValues, FieldValues>>({
  onOpenChange,
  title,
  description,
  schema,
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  busyLabel = "Saving…",
  children,
  setBusy,
}: FormDialogProps<S> & { setBusy: (busy: boolean) => void }) {
  const form = useForm<z.input<S>, unknown, z.output<S>>({ resolver: zodResolver(schema), defaultValues });
  const [error, setError] = useState<string>();
  const busy = form.formState.isSubmitting;

  const submit = form.handleSubmit(async (values) => {
    setError(undefined);
    setBusy(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription className="text-[14px]">{description}</DialogDescription>}
      </DialogHeader>
      {error && <Banner tone="danger">{error}</Banner>}
      <FieldGroup className="gap-4">{children(form)}</FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          {busy ? busyLabel : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Fields live in components/form/fields.tsx; re-exported so `@/components/form-dialog` stays one import.
export * from "@/components/form/fields";
export { zodResolver } from "@/components/form/resolver";
