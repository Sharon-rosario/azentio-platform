import { cn } from "@/lib/utils";

export type Tone = "danger" | "warning" | "success" | "info" | "neutral" | "brand";

export const TONES: Record<Tone, string> = {
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-brand-soft text-primary",
};

const DOT: Record<Tone, string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  success: "bg-success",
  info: "bg-info",
  neutral: "bg-muted-foreground",
  brand: "bg-brand",
};

// The one place that maps a backend value to a colour and label. Add new values here.
const MAP: Record<string, { tone: Tone; label: string }> = {
  // observation lifecycle
  draft: { tone: "neutral", label: "Draft" },
  submitted: { tone: "info", label: "In review" },
  returned: { tone: "warning", label: "Changes requested" },
  published: { tone: "success", label: "Published" },
  rejected: { tone: "danger", label: "Not published" },
  withdrawn: { tone: "neutral", label: "Withdrawn" },
  under_review: { tone: "warning", label: "Reported, under review" },
  superseded: { tone: "neutral", label: "Older version" },
  // who can see it
  private: { tone: "neutral", label: "Only me" },
  organisation: { tone: "info", label: "My organisation" },
  community: { tone: "brand", label: "Learning community" },
  // improvement ideas
  Proposed: { tone: "neutral", label: "Proposed" },
  "Under review": { tone: "info", label: "Under review" },
  Planned: { tone: "info", label: "Planned" },
  "In progress": { tone: "warning", label: "In progress" },
  Released: { tone: "success", label: "Released" },
  "Not proceeding": { tone: "neutral", label: "Not proceeding" },
  // memberships and invitations
  active: { tone: "success", label: "Active" },
  revoked: { tone: "neutral", label: "Revoked" },
  Pending: { tone: "info", label: "Pending" },
  Accepted: { tone: "success", label: "Accepted" },
  Revoked: { tone: "neutral", label: "Revoked" },
  Expired: { tone: "neutral", label: "Expired" },
  // audiences
  public: { tone: "success", label: "Public" },
  employee: { tone: "warning", label: "Employees only" },
  client: { tone: "info", label: "Clients" },
};

export function toneOf(value: string): Tone {
  return MAP[value]?.tone ?? "neutral";
}

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  const { tone, label } = MAP[value] ?? { tone: "neutral" as Tone, label: value };
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", DOT[tone])} />
      {label}
    </span>
  );
}

/** Risk thresholds used across the UI. Keep in sync with the scoring engine. */
export const RISK = { refer: 0.35, decline: 0.7 };

export function riskTone(value: number): Tone {
  return value >= RISK.decline ? "danger" : value >= RISK.refer ? "warning" : "success";
}

/** Risk 0..1 as a number, tinted by the band it falls in. */
export function RiskScore({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2 text-xs font-medium tabular-nums",
        TONES[riskTone(value)],
        className,
      )}
    >
      {value.toFixed(2)}
    </span>
  );
}

/** Horizontal meter with the refer/decline thresholds marked. */
export function RiskMeter({ value, className }: { value: number; className?: string }) {
  const tone = riskTone(value);
  return (
    <div className={cn("relative h-1.5 w-full rounded-full bg-muted", className)} role="meter" aria-valuemin={0} aria-valuemax={1} aria-valuenow={value} aria-label="Risk">
      <div className={cn("h-full rounded-full", DOT[tone])} style={{ width: `${Math.max(4, value * 100)}%` }} />
      {[RISK.refer, RISK.decline].map((t) => (
        <span key={t} aria-hidden className="bg-card absolute top-0 h-full w-0.5" style={{ left: `${t * 100}%` }} />
      ))}
    </div>
  );
}
