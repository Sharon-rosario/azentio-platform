import { ImageResponse } from "next/og";

// Home-screen icon: the azentio.ai mark (navy tile, mint node), rendered at build time.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#16303d" }}>
        <div style={{ width: 92, height: 92, borderRadius: 46, background: "rgba(85,255,190,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 26, background: "#55ffbe" }} />
        </div>
      </div>
    ),
    size,
  );
}
