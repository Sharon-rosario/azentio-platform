"use client";

import { Check, Hand, Inbox, Play, Plus, ScanSearch, Send, ShieldCheck, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AiraMark } from "@/components/aira";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Stage = "received" | "read" | "rewrite" | "checks" | "published";
type Outcome = {
  id: number; title: string; org: string; outcome: "published" | "held"; stage: Stage; reason: string;
  kinds: string[]; findings: { kind: string; text: string }[]; publishedTitle?: string; ms: number; aiMs: number;
};
type Row = {
  id: number; title: string; org: string;
  step: number; // index into STEPS reached so far; -1 while waiting in the queue
  final: "published" | "held" | null;
  result?: Outcome;
};

const STEPS: { key: Stage; label: string; detail: string; icon: typeof Inbox }[] = [
  { key: "received", label: "Received", detail: "Consent to publish on record", icon: Inbox },
  { key: "read", label: "AIRA reads", detail: "Names, contacts, numbers, disguised ones too", icon: ScanSearch },
  { key: "rewrite", label: "AIRA rewrites", detail: "Anonymous copy, same facts", icon: WandSparkles },
  { key: "checks", label: "Safety checks", detail: "No identifier survives; scanner on every field", icon: ShieldCheck },
  { key: "published", label: "Published", detail: "To shared learning, audited", icon: Send },
];
const PARALLEL = 6;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Autonomous mode: AIRA works through the whole queue in parallel. Each contribution is published through the
 * moderator's own publish path only when AIRA's de-identified copy passes every check; anything uncertain is held for a
 * person. The pipeline shows where every contribution is.
 */
export function Autopilot({ demo, queued }: { demo: boolean; queued: number }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [started, setStarted] = useState<number | null>(null);
  const [finished, setFinished] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const elapsed = started ? ((finished ?? now) - started) / 1000 : 0;
  const published = rows.filter((r) => r.final === "published").length;
  const held = rows.filter((r) => r.final === "held").length;
  const done = published + held;
  const atStep = (i: number) => rows.filter((r) => !r.final && r.step === i).length;
  const removed = rows.reduce((n, r) => n + (r.final === "published" ? r.result?.findings.length ?? 0 : 0), 0);

  const simulate = async () => {
    setSimulating(true);
    try {
      const r = await api<{ created: number }>("/api/moderation/simulate", "POST", { count: 25 });
      toast.success(`${r.created} contributions arrived from client banks`);
      router.refresh();
    } catch {
      // api() showed the reason
    } finally {
      setSimulating(false);
    }
  };

  const run = async () => {
    setRunning(true);
    setFinished(null);
    try {
      const q = await api<{ items: { id: number; title: string; org: string }[] }>("/api/moderation", "GET");
      const queue: Row[] = q.items.map((o) => ({ id: o.id, title: o.title, org: o.org, step: -1, final: null }));
      if (!queue.length) {
        toast("Nothing waiting for review");
        return;
      }
      setRows(queue);
      const t = Date.now();
      setStarted(t);
      setNow(t);
      timer.current = setInterval(() => setNow(Date.now()), 100);
      const update = (id: number, patch: Partial<Row>) => setRows((all) => all.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      let next = 0;
      const worker = async () => {
        while (next < queue.length) {
          const item = queue[next++];
          update(item.id, { step: 0 });
          await sleep(120);
          update(item.id, { step: 1 });
          try {
            const res = await api<Outcome>(`/api/moderation/${item.id}/auto`, "POST", {});
            // The server did these steps; play them back quickly so each one is visible.
            const last = STEPS.findIndex((s) => s.key === res.stage);
            for (let i = 2; i <= last; i++) {
              update(item.id, { step: i, result: res });
              await sleep(180);
            }
            update(item.id, { step: last, final: res.outcome, result: res });
          } catch {
            update(item.id, { final: "held" });
          }
        }
      };
      await Promise.all(Array.from({ length: Math.min(PARALLEL, queue.length) }, worker));
      setFinished(Date.now());
      router.refresh();
    } catch {
      // api() showed the reason
    } finally {
      if (timer.current) clearInterval(timer.current);
      setRunning(false);
    }
  };

  return (
    <section aria-labelledby="autopilot-title" className="bg-navy relative overflow-hidden rounded-2xl text-white shadow-card">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[#2ed88e]/15 blur-3xl" />
      <div className="relative grid gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <AiraMark job="autonomous review" tone="dark" className="mb-2" />
            <h2 id="autopilot-title" className="flex items-center gap-2 text-[20px] leading-7 font-semibold">
              Autonomous mode
            </h2>
            <p className="text-navy-muted mt-1 text-[14px] leading-[22px]">
              For a queue too long to read one by one. AIRA, the same agent that checks copies and summarises themes, reviews every
              contribution in parallel and publishes only what it can make anonymous safely. Anything uncertain stays in the queue for you.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {demo && (
              <Button type="button" variant="outline" onClick={simulate} loading={simulating} disabled={running || simulating}
                className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Plus /> Simulate 25 contributions
              </Button>
            )}
            <Button type="button" onClick={run} loading={running} disabled={running || simulating || (!queued && !rows.length)}
              className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Play /> {running ? "Running…" : `Run on ${queued} waiting`}
            </Button>
          </div>
        </div>

        {/* Live numbers */}
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="In the queue" value={rows.length ? rows.length - done : queued} />
          <Stat label="Published" value={published} tone="mint" />
          <Stat label="Held for you" value={held} tone="amber" />
          <Stat label="Identifiers removed" value={removed} />
          <Stat label={finished ? "Finished in" : "Elapsed"} value={`${elapsed.toFixed(1)} s`} live={running} />
        </dl>

        {/* The pipeline */}
        <ol aria-label="Processing steps" className="grid gap-3 md:grid-cols-5 md:gap-0">
          {STEPS.map((s, i) => {
            const active = running && atStep(i) > 0;
            const count = i === STEPS.length - 1 ? published : atStep(i);
            const Icon = s.icon;
            return (
              <li key={s.key} className="relative flex items-start gap-3 md:flex-col md:items-center md:text-center">
                {i < STEPS.length - 1 && (
                  <span aria-hidden className={cn("absolute top-6 left-[calc(50%+28px)] hidden h-0.5 w-[calc(100%-56px)] md:block",
                    running ? "ap-flow" : "bg-white/15")} />
                )}
                <span className={cn("relative grid size-12 shrink-0 place-items-center rounded-2xl border transition-colors",
                  i === STEPS.length - 1 && published ? "border-[#2ed88e] bg-[#2ed88e] text-[#16303d]"
                    : active ? "border-[#2ed88e] bg-[#2ed88e]/15 text-[#2ed88e]" : "border-white/15 bg-white/5 text-white/70")}>
                  {active && <span aria-hidden className="absolute inset-0 animate-ping rounded-2xl border border-[#2ed88e]/60" />}
                  <Icon className="size-5" />
                  {count > 0 && (
                    <span className="absolute -top-2 -right-2 grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[11px] font-semibold text-[#16303d] tabular-nums">
                      {count}
                    </span>
                  )}
                </span>
                <span className="md:mt-2 md:px-2">
                  <span className="block text-[14px] leading-5 font-medium">{s.label}</span>
                  <span className="text-navy-muted block text-[12px] leading-4">{s.detail}</span>
                </span>
              </li>
            );
          })}
        </ol>

        {/* Each contribution */}
        {rows.length > 0 && (
          <div className="rounded-xl bg-white/[0.04] ring-1 ring-white/10">
            <div className="text-navy-muted flex items-center justify-between px-4 py-2.5 text-[12px]">
              <span>{done} of {rows.length} reviewed · {PARALLEL} at a time</span>
              {finished && <span className="text-[#2ed88e]">Done. Held items are below in the queue.</span>}
            </div>
            <ul className="max-h-[440px] divide-y divide-white/10 overflow-y-auto border-t border-white/10">
              {rows.map((r) => <ItemRow key={r.id} row={r} />)}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, tone, live }: { label: string; value: number | string; tone?: "mint" | "amber"; live?: boolean }) {
  return (
    <div className="rounded-xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/10">
      <dt className="text-navy-muted flex items-center gap-1.5 text-[12px] leading-4">
        {live && <span className="size-1.5 animate-pulse rounded-full bg-[#2ed88e]" />}{label}
      </dt>
      <dd className={cn("mt-1 text-[24px] leading-8 font-semibold tabular-nums",
        tone === "mint" && "text-[#2ed88e]", tone === "amber" && "text-[#ffc46b]")}>{value}</dd>
    </div>
  );
}

function ItemRow({ row }: { row: Row }) {
  const r = row.result;
  const heldAt = row.final === "held" ? row.step : -1;
  return (
    <li className="ap-row grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6">
      <div className="min-w-0">
        <p className="text-navy-muted font-mono text-[11px] leading-4">{row.org}</p>
        <p className="truncate text-[14px] leading-5 font-medium">{row.title}</p>
        <p className={cn("mt-0.5 truncate text-[12px] leading-[18px]",
          row.final === "held" ? "text-[#ffc46b]" : row.final === "published" ? "text-[#2ed88e]" : "text-navy-muted")}>
          {row.final ? r?.reason ?? "Couldn't be processed; held for you"
            : row.step < 0 ? "Waiting in the queue" : row.step === 1 ? "AIRA is reading it…" : STEPS[row.step]?.label}
          {row.final === "published" && r?.publishedTitle && r.publishedTitle !== row.title && <span className="text-navy-muted"> · now “{r.publishedTitle}”</span>}
        </p>
        {r && r.kinds.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {r.kinds.map((k) => (
              <span key={k} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] leading-4 text-white/80">{k}</span>
            ))}
          </div>
        )}
      </div>
      <ol aria-label="Steps" className="flex items-center">
        {STEPS.map((s, i) => {
          const reached = row.step >= i;
          const isHeld = i === heldAt;
          const working = !row.final && row.step === i;
          return (
            <li key={s.key} className="flex items-center">
              <span title={s.label} className={cn("grid size-6 place-items-center rounded-full border text-[11px] transition-colors duration-200",
                isHeld ? "border-[#ffc46b] bg-[#ffc46b] text-[#16303d]"
                  : reached && (row.final === "published" || i < row.step) ? "border-[#2ed88e] bg-[#2ed88e] text-[#16303d]"
                  : working ? "border-[#2ed88e] text-[#2ed88e]" : "border-white/20 text-white/40")}>
                {isHeld ? <Hand className="size-3" /> : reached && (row.final === "published" || i < row.step) ? <Check className="size-3" strokeWidth={3} />
                  : working ? <span className="size-2 animate-pulse rounded-full bg-[#2ed88e]" /> : null}
              </span>
              {i < STEPS.length - 1 && (
                <span className={cn("h-0.5 w-5 transition-colors duration-200 sm:w-7", row.step > i && !(row.final === "held" && i >= heldAt) ? "bg-[#2ed88e]" : "bg-white/15")} />
              )}
            </li>
          );
        })}
      </ol>
    </li>
  );
}
