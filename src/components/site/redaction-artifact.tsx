import { Check } from "lucide-react";

/**
 * The product's core behaviour, set as text rather than a screenshot: a client's private observation with its
 * identifiers flagged, the moderator's decision, and the de-identified copy that is actually published.
 * Wording is the seed contribution from Kestrel Finance (src/server/seed.ts). Animates once (CSS only); still under reduced motion.
 */
export function RedactionArtifact() {
  return (
    <figure aria-label="How one observation becomes shared learning" className="bg-card overflow-hidden rounded-xl border">
      <div className="border-b px-5 py-4 sm:px-6">
        <p className="text-muted-foreground flex flex-col gap-1 font-mono text-[12px] leading-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span>original · submitted</span>
          <span>Kestrel Finance and the moderator only</span>
        </p>
        <p className="mt-3 text-[15px] leading-6">
          The new quarterly template moved two fields; our mappings silently produced blanks for one cycle. Contact{" "}
          <mark className="az-flag bg-warning-soft text-warning rounded-[3px] px-1">rbi.desk@kestrelfinance.example</mark> or account{" "}
          <mark className="az-flag bg-warning-soft text-warning rounded-[3px] px-1 tabular-nums">004512339871</mark> for the sample.
        </p>
      </div>

      <ul className="bg-muted/60 text-muted-foreground border-b px-5 py-3 font-mono text-[12px] leading-5 sm:px-6">
        <li className="az-step flex items-center gap-2" style={{ animationDelay: "500ms" }}>
          <Check className="text-primary size-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> consent recorded: publish a reviewed copy
        </li>
        <li className="az-step flex items-center gap-2" style={{ animationDelay: "700ms" }}>
          <Check className="text-primary size-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> moderator: 2 identifiers removed
        </li>
        <li className="az-step flex items-center gap-2" style={{ animationDelay: "900ms" }}>
          <Check className="text-primary size-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> re-scan clean: publication allowed
        </li>
      </ul>

      <div className="az-copy px-5 py-4 sm:px-6">
        <p className="text-muted-foreground flex flex-col gap-1 font-mono text-[12px] leading-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span>shared copy · v1</span>
          <span>learning community</span>
        </p>
        <p className="mt-3 text-[15px] leading-6">
          The new quarterly template moved two fields; our mappings silently produced blanks for one cycle.
        </p>
      </div>
      <figcaption className="sr-only">
        A private observation contains an email address and an account number. The moderator removes both, and only the
        de-identified copy is published to the learning community.
      </figcaption>
    </figure>
  );
}
