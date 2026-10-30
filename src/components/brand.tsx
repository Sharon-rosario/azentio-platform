import { cn } from "@/lib/utils";

// Azentio's official logo (azentio.com, public/brand/azentio-logo.svg), used at the organiser's request: the challenge
// brief asks teams to follow Azentio's branding and visual identity. The letters take the surrounding text colour so
// the same mark works on the white site header and the navy portal header and footer; the leaf stays Azentio green.

const LETTERS = [
  "M0.354 32.831C0.354 26.375 4.391 21.777 10.367 21.777C14.728 21.777 16.908 24.602 17.513 25.69H17.756V22.301H20.986V39.49C20.986 40.136 21.389 40.457 22.034 40.457H23.003V43.28H20.943C19.207 43.28 17.914 41.989 17.874 40.174V39.973H17.631C17.107 40.821 15.167 43.807 10.606 43.807C4.589 43.807 0.349 39.246 0.349 32.833L0.354 32.831ZM17.877 32.873C17.877 27.668 14.648 24.682 10.731 24.682C6.614 24.682 3.626 28.072 3.626 32.873C3.626 37.674 6.734 40.944 10.771 40.944C15.172 40.944 17.877 37.273 17.877 32.873Z",
  "M25.83 39.369L38.629 25.246V25.003H26.192V22.301H41.615V26.214L28.816 40.337V40.58H41.818V43.283H25.828V39.369H25.83Z",
  "M44.242 32.873C44.242 26.177 48.846 21.777 54.416 21.777C60.756 21.777 64.389 26.214 64.389 32.51V33.681H47.511C47.551 38.361 50.296 40.984 54.657 40.984C57.605 40.984 60.309 39.289 60.997 36.383L64.106 37.11C62.934 41.024 59.461 43.807 54.617 43.807C48.236 43.807 44.239 39.329 44.239 32.873H44.242ZM61.12 31.098C60.919 26.741 57.891 24.642 54.418 24.642C50.946 24.642 47.837 27.144 47.594 31.098H61.12Z",
  "M68.025 22.301H71.214V25.367H71.457C72.345 23.471 74.606 21.777 77.878 21.777C82.763 21.777 85.711 25.447 85.711 30.088V43.28H82.522V30.288C82.522 26.939 80.058 24.76 77.112 24.76C73.801 24.76 71.216 27.302 71.216 30.772V43.28H68.027V22.301H68.025Z",
  "M92.49 37.311V25.006H88.534V22.303H92.693V16.211H95.682V22.303H102.142V25.006H95.682V37.271C95.682 39.53 96.61 40.497 98.831 40.497H101.859V43.28H98.871C95.034 43.28 92.49 41.545 92.49 37.308V37.311Z",
  "M108.721 25.006H104.764V22.303H111.91V43.283H108.721V25.006ZM107.996 16.168C107.996 14.877 108.964 13.869 110.297 13.869C111.629 13.869 112.638 14.877 112.638 16.168C112.638 17.459 111.669 18.507 110.297 18.507C108.924 18.507 107.996 17.5 107.996 16.168Z",
  "M116.271 32.79C116.271 26.455 120.995 21.777 127.253 21.777C133.51 21.777 138.195 26.498 138.195 32.79C138.195 39.083 133.51 43.804 127.213 43.804C120.915 43.804 116.271 39.164 116.271 32.79ZM134.925 32.79C134.925 28.15 131.736 24.68 127.213 24.68C122.689 24.68 119.54 28.19 119.54 32.79C119.54 37.391 122.729 40.901 127.213 40.901C131.696 40.901 134.925 37.471 134.925 32.79Z",
];

/** The leaf, Azentio's mark: two rounded petals. Coordinates are in the full logo's viewBox. */
export const LEAF = [
  "M142.299 28.604V11.084C142.299 5.43 146.893 0.842 152.549 0.842V18.362C152.549 24.016 147.955 28.604 142.299 28.604Z",
  "M153.748 18.359V0.84C159.406 0.84 163.997 5.43 163.997 11.081V28.601C158.34 28.601 153.748 24.011 153.748 18.359Z",
];

export const AZENTIO_GREEN = "#2ED88E";
export const AZENTIO_NAVY = "#16303D";

/** The leaf on a navy tile: favicon, 404 page and anywhere a small square mark is needed. */
export function Mark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("bg-navy grid size-8 place-items-center rounded-[10px] ring-1 ring-white/10", className)}>
      <svg viewBox="141.3 -0.2 23.7 29.8" className="h-[58%] w-auto" fill={AZENTIO_GREEN}>
        {LEAF.map((d) => <path key={d} d={d} />)}
      </svg>
    </span>
  );
}

/** Azentio's logo with the ".ai" of the azentio.ai sub-brand. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-end gap-1", className)}>
      <svg viewBox="0 0 164 45" role="img" aria-label="azentio" className="h-[26px] w-auto">
        <g fill="currentColor" stroke="currentColor" strokeWidth="1.25" strokeMiterlimit="10">
          {LETTERS.map((d) => <path key={d} d={d} />)}
        </g>
        <g fill={AZENTIO_GREEN}>{LEAF.map((d) => <path key={d} d={d} />)}</g>
      </svg>
      <span className="text-brand-strong text-[17px] leading-[19px] font-semibold tracking-[-0.02em]">.ai</span>
    </span>
  );
}
