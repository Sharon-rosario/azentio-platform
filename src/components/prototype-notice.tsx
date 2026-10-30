/**
 * A thin line above every page, public site and portal alike. The site uses Azentio's real name and logo (at the
 * organiser's request), so nobody should mistake it for azentio.com or send it real details.
 */
export function PrototypeNotice() {
  return (
    <p role="note" className="bg-navy text-navy-muted px-4 py-1.5 text-center text-[12px] leading-4">
      Hackathon prototype for the Azentio.ai Build Labs challenge. Not an official Azentio website, and all data is
      synthetic.
    </p>
  );
}
