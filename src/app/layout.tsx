import type { Metadata } from "next";
import { IBM_Plex_Mono, Poppins } from "next/font/google";

import { PrototypeNotice } from "@/components/prototype-notice";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { appConfig, siteUrl } from "@/config/app";

import "./globals.css";

// Poppins is Azentio's brand typeface (azentio.com).
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const description =
  "Azentio's AI credit products and a secure portal where banks and lenders share market observations: reviewed, de-identified and governed by their own consent.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: appConfig.name, template: `%s · ${appConfig.name}` },
  description,
  applicationName: appConfig.name,
  // The preview image comes from app/opengraph-image.tsx and applies to every URL.
  openGraph: { type: "website", siteName: appConfig.name, title: appConfig.name, description, locale: "en_IN" },
  twitter: { card: "summary_large_image", title: appConfig.name, description },
  // A prototype that carries Azentio's real brand stays out of search results, so it never competes with azentio.com.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <PrototypeNotice />
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
