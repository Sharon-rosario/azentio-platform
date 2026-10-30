"use client";

import { OctagonX, TriangleAlert, type LucideIcon } from "lucide-react";
import { useState, useSyncExternalStore, type ReactNode } from "react";

import { Banner } from "@/components/banner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/**
 * Confirmation before an action that is hard to undo.
 *
 *   if (await confirm({ title: "Reject this application?", tone: "danger", confirmLabel: "Reject" })) …
 *
 * Pass `onConfirm` to run the action inside the dialog: it stays open with a busy button until the
 * promise settles, and shows the error in place if it fails (so nothing fails silently).
 * Mount <ConfirmHost /> once (app layout).
 */
export type ConfirmOptions = {
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  busyLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "warning" | "danger";
  onConfirm?: () => Promise<unknown>;
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

let current: Pending | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function confirm(options: ConfirmOptions): Promise<boolean> {
  current?.resolve(false);
  return new Promise((resolve) => {
    current = { ...options, resolve };
    emit();
  });
}

function close(ok: boolean) {
  current?.resolve(ok);
  current = null;
  emit();
}

const TONE: Record<NonNullable<ConfirmOptions["tone"]>, { icon?: LucideIcon; media: string; button: "default" | "dark" | "destructive" }> = {
  default: { media: "", button: "dark" },
  warning: { icon: TriangleAlert, media: "bg-warning-soft text-warning", button: "dark" },
  danger: { icon: OctagonX, media: "bg-danger-soft text-danger", button: "destructive" },
};

export function ConfirmHost() {
  const pending = useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => current,
    () => null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const tone = TONE[pending?.tone ?? "default"];

  const run = async () => {
    if (!pending?.onConfirm) return close(true);
    setBusy(true);
    setError(undefined);
    try {
      await pending.onConfirm();
      close(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog
      open={!!pending}
      onOpenChange={(open) => {
        if (!open && !busy) {
          setError(undefined);
          close(false);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          {tone.icon && (
            <AlertDialogMedia className={cn(tone.media)}>
              <tone.icon className="size-5" strokeWidth={2} />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
          {pending?.description && (
            <AlertDialogDescription className="text-[14px] leading-[22px]">{pending.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {error && <Banner tone="danger">{error}</Banner>}
        <AlertDialogFooter>
          {/* Danger: focus lands on Cancel, so a stray Enter never confirms. */}
          <AlertDialogCancel disabled={busy} autoFocus={pending?.tone === "danger"}>
            {pending?.cancelLabel ?? "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction variant={tone.button} loading={busy} onClick={run} autoFocus={pending?.tone !== "danger"}>
            {busy ? (pending?.busyLabel ?? "Working…") : (pending?.confirmLabel ?? "Confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
