"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";

/** Change an idea's status and public note. Contributors behind the theme are notified by the server. */
export function IdeaStatusControl({
  ideaId,
  status,
  note,
  statuses,
}: {
  ideaId: number;
  status: string;
  note: string | null;
  statuses: readonly string[];
}) {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState(status);
  const [text, setText] = useState(note ?? "");
  const [busy, setBusy] = useState(false);
  const dirty = value !== status || text.trim() !== (note ?? "").trim();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/api/ideas/${ideaId}`, "PATCH", { status: value, public_note: text });
      toast.success(`Status saved as "${value}"`);
      router.refresh();
    } catch {
      // toast already shown
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="bg-muted grid gap-3 rounded-[12px] p-3">
      <div className="grid gap-1.5">
        <label htmlFor={`${id}-status`} className="text-[13px] font-medium">Status</label>
        <Select items={statuses.map((s) => ({ value: s, label: s }))} value={value} onValueChange={(v) => v && setValue(v)}>
          <SelectTrigger id={`${id}-status`} size="sm" className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={`${id}-note`} className="text-[13px] font-medium">Public note</label>
        <Textarea id={`${id}-note`} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000}
          placeholder="What's happening, in plain words" className="bg-card" />
        <p className="text-muted-foreground text-[12px]">Clients see this note and the status; nothing else.</p>
      </div>
      <div>
        <Button type="submit" size="sm" variant="dark" loading={busy} disabled={!dirty}>
          {busy ? "Saving…" : "Save status"}
        </Button>
      </div>
    </form>
  );
}
