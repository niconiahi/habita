# /signup

## Page (`+page.svelte`)

Client-side only — no `+page.server.ts`. Uses `authClient.signUp.email()` with `{ name, email, password, surname }` and `authClient.signIn.social({ provider: "google" })`.

## Auth

Public page. Redirects to `/account/create` on success.

## Key Components

Content, Section, Button
