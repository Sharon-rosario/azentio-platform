import type { ReactNode } from "react";

/** A section title inside a public page: 20px heading, optional line under it, optional action on the right. */
export function SectionHeading({ id, title, description, action }: {
  id?: string; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-[20px] leading-7 font-medium tracking-[-0.01em]">{title}</h2>
        {description && <p className="text-muted-foreground mt-0.5 text-[14px]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
