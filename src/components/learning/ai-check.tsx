"use client";

import { CircleCheck, Sparkles, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Finding = { text: string; kind: string; reason: string };
type Result = { findings: Finding[]; model: string; checked: string };

/**
 * AIRA's identifier check on the copy being reviewed. Advisory: it never blocks publishing, and if the model is
 * unavailable the moderator carries on with the automatic checks and their own reading, as before.
 */
export function AiCheck({ id, title, body }: { id: number; title: string; body: string }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const copy = `${title}\n${body}`;
  const lower = copy.toLowerCase();
  const remaining = result?.findings.filter((f) => lower.includes(f.text.toLowerCase())) ?? [];
  const stale = !!result && result.checked !== copy;

  const run = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const res = await api<{ findings: Finding[]; model: string }>(`/api/moderation/${id}/ai-check`, "POST", { title, body });
      setResult({ ...res, checked: copy });
    } catch {
      // api() already showed the reason as a toast
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button type="button" variant="outline" size="sm" loading={busy} onClick={run}>
          <Sparkles /> {busy ? "AIRA is reading the copy…" : result ? "Check again with AIRA" : "Check for hidden identifiers with AIRA"}
        </Button>
        <p className="text-muted-foreground text-[12px] leading-[18px]">
          Finds names and disguised details the automatic check can miss. Advisory: you decide what&apos;s published.
        </p>
      </div>

      {failed && !result && (
        <p className="text-muted-foreground text-[13px]">AIRA&apos;s check isn&apos;t available right now. The automatic checks above still apply.</p>
      )}

      {result && (
        <div
          className={cn("border-l-2 px-4 py-3 text-[14px] leading-5", remaining.length ? "border-warning bg-warning-soft" : "border-success bg-success-soft")}
          role="status"
        >
          <p className="flex items-center gap-2 font-medium">
            {remaining.length ? <TriangleAlert className="text-warning size-4" /> : <CircleCheck className="text-success size-4" />}
            {!result.findings.length
              ? "AIRA found nothing identifying"
              : remaining.length
                ? `AIRA: ${remaining.length} possible ${remaining.length === 1 ? "identifier is" : "identifiers are"} still in the copy`
                : "Everything AIRA found is out of the copy"}
          </p>
          {result.findings.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {result.findings.map((f) => (
                <li key={f.text} className={cn("min-w-0 break-words", !remaining.includes(f) && "text-muted-foreground line-through")}>
                  {f.kind}: <span className="font-mono">{f.text}</span>
                  <span className="text-muted-foreground"> · {f.reason}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted-foreground mt-1.5 text-[12px] leading-[18px]">
            {stale ? "The copy changed since this check. " : ""}AI-assisted ({result.model}); it can miss things, so read it yourself too.
          </p>
        </div>
      )}
    </div>
  );
}
