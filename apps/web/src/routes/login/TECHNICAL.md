# /login

## Page (`+page.svelte`)
Client-side only — no `+page.server.ts`. Uses `authClient.signIn.email()` and `authClient.signIn.social({ provider: "google" })` from Better Auth client.

## Auth
No server-side auth check — this is a public page. Redirects to `/properties` on successful login.

## Key Components
Content, Section, Button (all from `$lib/components`)
