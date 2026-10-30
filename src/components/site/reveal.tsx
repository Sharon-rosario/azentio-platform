"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Scroll reveal for elements marked `data-reveal` (stagger with `--reveal-delay`). Progressive enhancement: without
 * JavaScript, or with reduced motion, everything is simply visible; the hidden state only applies once this runs.
 * It re-runs on every navigation, so a shared layout can host it.
 */
export function RevealOnScroll() {
  const pathname = usePathname();
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    for (const el of document.querySelectorAll("[data-reveal]:not([data-revealed])")) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.setAttribute("data-revealed", "");
    }
    root.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-revealed", "");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    document.querySelectorAll("[data-reveal]:not([data-revealed])").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, [pathname]);
  return null;
}
