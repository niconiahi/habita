# /chat/full

## Loader (`+page.server.ts`)

Auth gate with two checks:

1. `locals.user` — redirects unauthenticated users to `/auth/google`
2. Email domain — redirects non-@habita.rent users to `/chat`

## Endpoint (`+server.ts` — POST)

Same streaming pattern as `/chat` but with:

- Auth check: 401 if no session, 403 if wrong email domain
- Uses `compose_full_system_prompt()` from local `context.server.ts`
- `max_tokens: 2048` (vs 1024 for public chat)

Validation: `RequestSchema` with `v.safeParse` — array of `{ role, content }` messages.

## Context (`context.server.ts`)

Loads six documentation categories via `import.meta.glob`:

1. Product docs (`/docs/product/*.md`)
2. Route descriptions (`/src/routes/**/docs/description.md`)
3. User journeys (`/docs/product/user-journey/**/*.md`)
4. Route technical docs (`/src/routes/**/docs/technical.md`)
5. Security docs (`/docs/security/*.md`)
6. Platform technical docs (`/docs/technical/*.md`)

No webmaster filtering — internal users see all routes.

## Auth

- Authentication: required (Better Auth session)
- Authorization: email must end with `@habita.rent`

## Environment

- `OPENAI_API_KEY` — required
