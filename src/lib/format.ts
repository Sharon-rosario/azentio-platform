// All display formatting lives here, so numbers look the same on every page.
import { appConfig } from "@/config/app";

// Dates render in the product's time zone, so server and browser always agree.
const timeZone = appConfig.timeZone;

const LOCALES: Record<string, string> = { INR: "en-IN", AED: "en-AE", USD: "en-US" };

export function money(amount: number | null | undefined, currency = "INR", compact = false) {
  if (amount == null) return "—";
  return new Intl.NumberFormat(LOCALES[currency] ?? "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard",
  }).format(amount);
}

export function num(n: number | null | undefined) {
  return n == null ? "—" : new Intl.NumberFormat("en-IN").format(n);
}

export function pct(n: number | null | undefined, digits = 0) {
  return n == null ? "—" : `${(n * 100).toFixed(digits)}%`;
}

/** Risk is 0..1; show it the way the anomaly engine reports it (0.985). */
export function risk(n: number | null | undefined) {
  return n == null ? "—" : n.toFixed(3);
}

export function date(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone });
}

export function dateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
}

export function relative(iso: string | null | undefined) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (diff < 60) return "just now";
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
  return rtf.format(-Math.round(diff / 86400), "day");
}

export function bytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}
