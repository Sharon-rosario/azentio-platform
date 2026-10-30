import type { ReactNode } from "react";

/** Inner public pages share the standard container; the home page composes its own full-width sections. */
export default function PagesLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 sm:py-14">{children}</div>;
}
