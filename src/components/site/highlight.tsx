import type { ReactNode } from "react";

/** Words in mint with a hand-drawn underline that draws in once (the `.scribble` motion in globals.css). */
export function Highlight({ children }: { children: ReactNode }) {
  return (
    <span className="text-brand relative inline-block whitespace-nowrap">
      {children}
      <svg aria-hidden viewBox="0 0 300 24" preserveAspectRatio="none" className="scribble absolute -bottom-3 left-0 h-4 w-full md:-bottom-4 md:h-5">
        <path pathLength={1} d="M4 15 C 70 5, 150 4, 296 9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path pathLength={1} d="M30 21 C 110 13, 190 12, 268 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      </svg>
    </span>
  );
}
