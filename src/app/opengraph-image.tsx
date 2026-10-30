import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { AZENTIO_GREEN, AZENTIO_NAVY, LEAF } from "@/components/brand";

// The one link-preview image for every URL (WhatsApp, Slack, LinkedIn, X), rendered at build time. Azentio's navy with
// the bold green geometry of azentio.com's hero, Poppins (Azentio's typeface, bundled in assets/fonts under the OFL),
// a small "shared copy" card that tells the product's story at a glance, and a plain note that this is a hackathon
// prototype, not Azentio's own site.
export const alt = "azentio.ai: banks learn from each other, nobody sees who said what";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (file: string) => readFile(join(process.cwd(), "assets", "fonts", file));

const MUTED = "#b7c9d1";
const FAINT = "#8fa6b2";
const MINT = "#55ffbe";

function Leaf({ height }: { height: number }) {
  return (
    <svg width={Math.round(height * 0.795)} height={height} viewBox="141.3 -0.2 23.7 29.8" fill={AZENTIO_GREEN}>
      {LEAF.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

export default async function OpenGraphImage() {
  const [regular, semibold] = await Promise.all([font("Poppins-Regular.ttf"), font("Poppins-SemiBold.ttf")]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: AZENTIO_NAVY, color: "#ffffff", fontFamily: "Poppins" }}>
        {/* Green geometry on the right, as on azentio.com: three bars, an arch and a quarter circle. */}
        <div style={{ position: "absolute", top: 0, right: 330, width: 34, height: 250, background: AZENTIO_GREEN }} />
        <div style={{ position: "absolute", top: 0, right: 274, width: 34, height: 190, background: AZENTIO_GREEN }} />
        <div style={{ position: "absolute", top: 0, right: 218, width: 34, height: 130, background: AZENTIO_GREEN }} />
        <div style={{ position: "absolute", top: -150, right: -150, width: 300, height: 300, borderRadius: 150, border: `34px solid ${AZENTIO_GREEN}` }} />
        <div style={{ position: "absolute", bottom: 0, right: 0, width: 380, height: 380, borderTopLeftRadius: 380, background: AZENTIO_GREEN }} />

        {/* The product in one card: a reviewed, de-identified copy. */}
        <div style={{ position: "absolute", top: 232, right: 96, width: 380, display: "flex", flexDirection: "column", background: "#ffffff", color: AZENTIO_NAVY, borderRadius: 22, padding: "26px 28px", boxShadow: "0 24px 60px rgba(0,0,0,0.35)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, color: "#5b7380" }}>
            <span>shared copy · v1</span>
            <span>learning community</span>
          </div>
          <div style={{ marginTop: 14, fontSize: 23, lineHeight: 1.35, fontWeight: 600 }}>
            Seasonal SMEs look riskier than they really are.
          </div>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8, fontSize: 16, color: "#33505e" }}>
            {["De-identified by a moderator", "Shared with the author's consent", "AI quotes checked against sources"].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: 10, background: AZENTIO_GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke={AZENTIO_NAVY} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Left: brand, promise, prototype note. */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 0 56px 72px", width: 640 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 54, height: 54, borderRadius: 15, background: "#1f3f4f", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Leaf height={30} />
            </div>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 600, letterSpacing: -0.5 }}>
              <span>azentio</span>
              <span style={{ color: AZENTIO_GREEN }}>.ai</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 58, lineHeight: 1.1, fontWeight: 600, letterSpacing: -1.5 }}>Banks learn from each other.</div>
            <div style={{ fontSize: 58, lineHeight: 1.1, fontWeight: 600, letterSpacing: -1.5, color: MINT }}>Nobody sees who said what.</div>
            <div style={{ marginTop: 26, fontSize: 25, lineHeight: 1.45, color: MUTED }}>
              A secure portal where competing banks share what they see in their markets, safely.
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 17, color: FAINT }}>
            Hackathon prototype · not an official Azentio website
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Poppins", data: regular, style: "normal", weight: 400 },
        { name: "Poppins", data: semibold, style: "normal", weight: 600 },
      ],
    },
  );
}
