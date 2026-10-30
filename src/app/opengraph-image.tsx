import { ImageResponse } from "next/og";

// The one link-preview image for every URL (WhatsApp, Slack, LinkedIn, X): calm, in Azentio's brand colours.
export const alt = "azentio.ai: banks learn from each other, nobody sees who said what";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#16303d", color: "#ffffff", position: "relative" }}>
        {/* Mint blocks at the right edge, as on the site's hero. */}
        <div style={{ position: "absolute", top: 0, right: 0, width: 300, height: 315, background: "rgba(46,216,142,0.16)" }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 110, height: 220, background: "rgba(85,255,190,0.10)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#1d3d4d", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: "#55ffbe" }} />
          </div>
          <div style={{ display: "flex", fontSize: 36 }}>
            <span>azentio</span>
            <span style={{ color: "#2ed88e", marginLeft: -4 }}>.ai</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 860 }}>
          <div style={{ fontSize: 66, lineHeight: 1.08, letterSpacing: -2 }}>Banks learn from each other.</div>
          <div style={{ fontSize: 66, lineHeight: 1.08, letterSpacing: -2, color: "#55ffbe" }}>Nobody sees who said what.</div>
          <div style={{ marginTop: 28, fontSize: 28, lineHeight: 1.4, color: "#b7c9d1" }}>
            AI credit products and a secure portal for governed, collective learning.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 22, color: "#b7c9d1" }}>
          {["Private by default", "Consent per purpose", "De-identified copies", "Verified AI quotes"].map((t) => (
            <div key={t} style={{ display: "flex", padding: "10px 20px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.18)" }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
