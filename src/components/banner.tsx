import { CircleCheck, Info, OctagonX, TriangleAlert, X, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "danger";

// A tinted note with a toned rule on the left.
const STYLE: Record<Tone, { box: string; icon: LucideIcon; iconColor: string }> = {
  info: { box: "border-info bg-info-soft", icon: Info, iconColor: "text-info" },
  success: { box: "border-success bg-success-soft", icon: CircleCheck, iconColor: "text-success" },
  warning: { box: "border-warning bg-warning-soft", icon: TriangleAlert, iconColor: "text-warning" },
  danger: { box: "border-danger bg-danger-soft", icon: OctagonX, iconColor: "text-danger" },
};

/**
 * Inline message that stays on the page (unlike a toast). Use for states the person must
 * notice before acting: a placeholder engine, a decision against the recommendation, the API down.
 * Title is optional; the body should still read on its own. `role="alert"` only for danger.
 */
export function Banner({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  className,
}: {
  tone?: Tone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const s = STYLE[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-r-xl border-l-[3px] py-3 pr-4 pl-4 text-[14px] leading-[21px]", s.box, className)}
    >
      <s.icon className={cn("mt-0.5 size-4 shrink-0", s.iconColor)} strokeWidth={2} />
      <div className="min-w-0 flex-1">
        {title && <p className="text-foreground text-[15px] font-medium">{title}</p>}
        {children && <div className={cn(title ? "text-foreground/80 mt-0.5" : "text-foreground/90")}>{children}</div>}
        {action && <div className="mt-2.5">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-foreground/60 hover:text-foreground -m-1 grid size-7 shrink-0 place-items-center rounded-full transition-colors"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
