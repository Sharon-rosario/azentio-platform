"use client";

import { CircleCheck, Eraser, Sparkles, TriangleAlert, Undo2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { applyRedactions } from "@/lib/redact";
import { cn } from "@/lib/utils";

type Finding = { text: string; kind: string; reason: string; replacement: string };
type Result = { findings: Finding[]; model: string; checked: string; removed: boolean; rewritten: boolean };

/**
 * AIRA's identifier check on the copy being reviewed. "Remove" puts AIRA's de-identified rewrite (checked on the
 * server) in the moderator's editable copy, or, if it failed the checks, the copy with exactly what AIRA found replaced by
 * neutral wording. Nothing is published, and Undo puts the copy back. Advisory: if the model is
 * unavailable the moderator carries on with the automatic checks and their own reading, as before.
 */
export function AiCheck({ id, title, body, onChange }: {
  id: number;
  title: string;
  body: string;
  onChange: (title: string, body: string) => void;
}) {
  const [busy, setBusy] = useState<"check" | "remove" | null>(null);
  const [failed, setFailed] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [before, setBefore] = useState<{ title: string; body: string } | null>(null);
  const copy = `${title}\n${body}`;
  const lower = copy.toLowerCase();
  const remaining = result?.findings.filter((f) => lower.includes(f.text.toLowerCase())) ?? [];
  const stale = !!result && result.checked !== copy;

  const run = async (mode: "check" | "remove") => {
    setBusy(mode);
    setFailed(false);
    try {
      const res = await api<{ findings: Finding[]; model: string; rewrite: { title: string; body: string } | null }>(
        `/api/moderation/${id}/ai-check`, "POST", { title, body, mode });
      if (mode === "remove" && res.findings.length) {
        const next = res.rewrite ?? { title: applyRedactions(title, res.findings), body: applyRedactions(body, res.findings) };
        setBefore({ title, body });
        onChange(next.title, next.body);
        setResult({ ...res, checked: `${next.title}\n${next.body}`, removed: true, rewritten: !!res.rewrite });
      } else {
        setBefore(null);
        setResult({ ...res, checked: copy, removed: false, rewritten: false });
      }
    } catch {
      // api() already showed the reason as a toast
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  const undo = () => {
    if (!before) return;
    onChange(before.title, before.body);
    setBefore(null);
    setResult(null);
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" loading={busy === "remove"} disabled={!!busy} onClick={() => run("remove")}>
          <Eraser /> {busy === "remove" ? "AIRA is removing identifiers…" : "Remove identifiers with AIRA"}
        </Button>
        <Button type="button" variant="outline" size="sm" loading={busy === "check"} disabled={!!busy} onClick={() => run("check")}>
          <Sparkles /> {busy === "check" ? "AIRA is reading the copy…" : "Check only"}
        </Button>
      </div>
      <p className="text-muted-foreground -mt-1 text-[12px] leading-[18px]">
        Finds names and disguised details the automatic check can miss, and rewrites the copy below without them.
        Nothing is published until you choose Publish.
      </p>

      {failed && !result && (
        <p className="text-muted-foreground text-[13px]">AIRA&apos;s check isn&apos;t available right now. The automatic checks above still apply.</p>
      )}

      {result && (
        <div
          className={cn("border-l-2 px-4 py-3 text-[14px] leading-5", remaining.length ? "border-warning bg-warning-soft" : "border-success bg-success-soft")}
          role="status"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 font-medium">
              {remaining.length ? <TriangleAlert className="text-warning size-4" /> : <CircleCheck className="text-success size-4" />}
              {!result.findings.length
                ? "AIRA found nothing identifying"
                : remaining.length
                  ? `AIRA: ${remaining.length} possible ${remaining.length === 1 ? "identifier is" : "identifiers are"} still in the copy`
                  : result.rewritten
                    ? `AIRA rewrote the copy without ${result.findings.length} identifying ${result.findings.length === 1 ? "detail" : "details"}. Read it before you publish.`
                    : result.removed
                    ? `AIRA removed ${result.findings.length} identifying ${result.findings.length === 1 ? "detail" : "details"}. Read the copy before you publish.`
                    : "Everything AIRA found is out of the copy"}
            </p>
            {before && (
              <Button type="button" variant="ghost" size="sm" onClick={undo}>
                <Undo2 /> Undo
              </Button>
            )}
          </div>
          {result.findings.length > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {result.findings.map((f) => {
                const left = remaining.includes(f);
                return (
                  <li key={f.text} className="min-w-0 break-words">
                    {f.kind}: <span className={cn("font-mono", !left && "text-muted-foreground line-through")}>{f.text}</span>
                    {result.removed && !result.rewritten && !left ? <> → <span className="font-medium">{f.replacement}</span></> : null}
                    <span className="text-muted-foreground"> · {f.reason}</span>
                  </li>
                );
              })}
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
