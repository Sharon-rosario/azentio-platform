import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Page-shaped placeholders. Each mirrors its page's real layout (same panels, same heights),
// so when data arrives everything swaps in at once without shifting.

function Bar({ className }: { className?: string }) {
  return <Skeleton className={cn("rounded-full", className)} />;
}

/** Bars that sit on the grey canvas (headers) need a touch more ink than bars inside white cards. */
const onCanvas = "bg-foreground/[0.07]";

function Card({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn("border-t pt-5", className)}>{children}</div>;
}

function PanelBones({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <Card className={className}>
      <Bar className="h-4 w-40" />
      <Bar className="mt-2 h-3 w-56" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-xl" />
        ))}
      </div>
    </Card>
  );
}

function HeaderBones({ actions = 0 }: { actions?: number }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <Bar className={cn("h-7 w-56", onCanvas)} />
        <Bar className={cn("h-4 w-80", onCanvas)} />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: actions }).map((_, i) => (
          <Bar key={i} className={cn("h-9 w-32", onCanvas)} />
        ))}
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Bar className={cn("h-4 w-40", onCanvas)} />
          <Bar className={cn("h-9 w-80", onCanvas)} />
        </div>
        <div className="flex gap-2">
          <Bar className={cn("h-9 w-44", onCanvas)} />
          <Bar className={cn("h-9 w-32", onCanvas)} />
        </div>
      </div>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bar key={i} className="bg-card h-12 w-48 shrink-0" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Bar className={cn("h-5 w-48", onCanvas)} />
          <Bar className={cn("h-3.5 w-72", onCanvas)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-[268px] space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-1.5">
                  <Bar className="h-4 w-28" />
                  <Bar className="h-3 w-36" />
                </div>
              </div>
              <Bar className="h-7 w-36" />
              <Bar className="h-1.5 w-full" />
              <Bar className="h-3 w-full" />
              <Bar className="h-3 w-3/4" />
            </Card>
          ))}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <PanelBones rows={8} className="lg:col-span-2" />
        <div className="grid gap-3">
          <PanelBones rows={2} />
          <PanelBones rows={3} />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <HeaderBones actions={1} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="flex h-[148px] flex-col justify-between">
            <Bar className="h-3.5 w-32" />
            <div className="space-y-2">
              <Bar className="h-8 w-20" />
              <Bar className="h-3 w-40" />
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="h-[340px] lg:col-span-2">
          <Bar className="h-4 w-40" />
          <Skeleton className="mt-8 h-[220px] w-full rounded-xl" />
        </Card>
        <PanelBones rows={6} />
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="h-[320px] lg:col-span-2">
          <Bar className="h-4 w-40" />
          <Skeleton className="mt-8 h-[200px] w-full rounded-xl" />
        </Card>
        <PanelBones rows={6} />
      </div>
      <PanelBones rows={6} />
    </div>
  );
}

export function CasesSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <HeaderBones />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Bar className="bg-card h-10 w-[380px] max-w-full" />
        <Bar className="bg-card h-9 w-64" />
      </div>
      <Card className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-xl" />
        ))}
      </Card>
    </div>
  );
}

export function CaseDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <Bar className={cn("h-4 w-28", onCanvas)} />
      <HeaderBones actions={2} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <PanelBones rows={2} />
          <PanelBones rows={4} />
        </div>
        <div className="space-y-4">
          <PanelBones rows={2} />
          <PanelBones rows={4} />
        </div>
      </div>
    </div>
  );
}

export function DocumentsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <HeaderBones />
      <div className="grid items-start gap-3 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-5">
          <Card>
            <Bar className="h-4 w-24" />
            <div className="mt-4 flex flex-wrap gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Bar key={i} className="h-8 w-24" />
              ))}
            </div>
            <Skeleton className="mt-4 h-[178px] w-full rounded-[12px]" />
          </Card>
          <PanelBones rows={3} />
        </div>
        <PanelBones rows={6} className="lg:col-span-7" />
      </div>
    </div>
  );
}

export function AssistantSkeleton() {
  return (
    <div className="flex h-[calc(100svh-7.5rem)] gap-5 md:h-[calc(100svh-3rem)]" aria-busy="true" aria-label="Loading">
      <Card className="hidden w-[264px] shrink-0 rounded-[20px] p-3 lg:block">
        <Skeleton className="h-9 w-full rounded-full" />
        <div className="mt-4 space-y-2">
          {[70, 90, 60, 80].map((w) => (
            <Skeleton key={w} className="h-8 rounded-[12px]" style={{ width: `${w}%` }} />
          ))}
        </div>
      </Card>
      <div className="mx-auto flex w-full max-w-[760px] min-w-0 flex-1 flex-col justify-end gap-2 px-1">
        <Skeleton className="h-14 w-full rounded-[20px]" />
        <Bar className={cn("h-3 w-72", onCanvas)} />
      </div>
    </div>
  );
}
