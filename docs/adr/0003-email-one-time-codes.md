# 0003 · Sign in with one-time email codes

- **Status:** Accepted
- **Date:** 2026-10-30

## Context

The brief prefers Microsoft 365 / Entra ID over OIDC for employees, but says that where an organisational app
registration isn't available, teams should "use a real managed email-code/magic-link identity flow and
organiser-approved employee provisioning". We have no Entra tenant to register in. Clients join by invitation, and
an arbitrary email address must never create a trusted membership.

We also have no email provider in the judging environment.

## Decision

**Passwordless sign-in with a six-digit code sent to the email address**, verified on the server
(`auth.ts` `requestCode()`, `verifyCode()`):

- The code is stored only as an HMAC (keyed by `SESSION_SECRET`), lasts 10 minutes, works once, and allows 5 wrong
  attempts. Code requests are limited per address. Comparison is constant-time.
- The response to "send me a code" is the same whether or not the address has an account.
- A newly verified address gets a user with **no membership**: identity is proven, but no tenant or role is trusted.
  Memberships come only from seeding (employees, standing in for organiser-approved provisioning) or from accepting an
  invitation bound to that exact address.
- The session is an opaque random id in a `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax` cookie, stored hashed, with
  the user's memberships reloaded on every request so revocation is immediate.

Mail goes to an `outbox` table. In demo mode only, the outbox is shown on screen, and only for the synthetic personas
and the reserved `.example` domain, so a code for a real mailbox is never displayed. Nothing is labelled "delivered".

## Consequences

- No passwords to store, leak, reset or brute-force.
- Proof of mailbox control is the same identity signal a magic link gives, and is what the brief allows.
- Entra ID slots in later as another way to prove identity; memberships, roles and sessions don't change.
- Without an email provider, real users can't receive codes; the demo relies on `DEMO_MODE` and synthetic addresses.
- Email is only as strong as the mailbox; enterprise SSO with MFA is the right production answer, and SECURITY.md
  says so.

## Alternatives considered

- **Magic links.** Corporate mail scanners (for example Microsoft Defender Safe Links) open links to check them,
  which spends a single-use link before the person clicks it. A link also puts a credential in the URL, browser
  history and possibly `Referer` headers, and it signs in whichever device opens the email, not the one that asked.
  A code is typed into the session that requested it.
- **Passwords.** More to build and secure (hashing, reset, lockout, breach checks) for a weaker result.
- **Supabase Auth or a hosted identity provider.** Another service and its own user table to keep in step with our
  memberships; no benefit over codes without a real email provider.
- **Trusting the `@azentio.com` suffix for employees.** The brief rules out deriving authority from an email suffix
  alone; employee access comes from a provisioned membership.
