import { ImageResponse } from "next/og";

import { AZENTIO_GREEN, AZENTIO_NAVY, LEAF } from "@/components/brand";

// Home-screen icon: Azentio's leaf on a navy tile, rendered at build time.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: AZENTIO_NAVY }}>
        <svg width="80" height="101" viewBox="141.3 -0.2 23.7 29.8" fill={AZENTIO_GREEN}>
          {LEAF.map((d) => <path key={d} d={d} />)}
        </svg>
      </div>
    ),
    size,
  );
}
