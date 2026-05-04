---
name: route_docs
description: Route documentation convention. Use when creating new routes, adding docs to existing routes, or understanding how route documentation works.
---

# Route Docs

Every route in `apps/web/src/routes/` has a `docs/` subdirectory containing two Markdown files:

```
routes/
  some-route/
    +page.svelte
    +page.server.ts
    docs/
      description.md   ← what the route does (product-level)
      technical.md      ← how the route works (developer-level)
```

Both files are mandatory for every route — pages, layouts, API endpoints, webhooks, and static callback pages.

---

## description.md

Explains **what** the route does for someone who hasn't read the code.

### Rules

- Heading: human-friendly name of the page/endpoint purpose (not the route path)
- Tone: conversational, product-oriented, no code references
- Content: purpose, what users can do, who has access, special behaviors
- Length: 2–6 sentences for simple routes; bulleted feature list for complex ones
- No inline code, no function names, no file paths
- **Exact UI labels**: when mentioning buttons, tabs, links, or any interactive element, quote the EXACT label as it appears in the template. Write `el botón "Nueva propiedad"`, not `crear una nueva propiedad`. Read the +page.svelte to verify. This is critical — the AI assistant uses these docs to guide users, and paraphrased labels cause confusion

### Security — what NEVER goes in description.md

description.md is product-level and could be read by anyone with repo access. It must never expose information that helps an attacker profile or exploit the system:

- **No auth bypass mechanisms** — never mention secret keys, internal-only auth modes, or alternative authentication paths. If an endpoint has a special internal access mode, that detail belongs exclusively in technical.md.
- **No third-party vendor names** — use generic references ("the digital signature provider", "the payment provider") instead of specific vendor names ("Alpha2000 Firmador"). Vendor names help attackers research specific API vulnerabilities and integration weak points. Exception: vendors already exposed in URL paths (e.g., "Mercado Pago" when the route is `/webhooks/mercadopago`).
- **No internal architecture details** — no mention of caching layers, database engines, encryption algorithms, signature verification methods, or infrastructure topology. All of that lives in technical.md.
- **No secret/token/key references** — not even abstractly ("uses a secret key to..."). If it involves secrets, it's a technical.md concern.

**The principle**: description.md answers "what can a user do here?" — technical.md answers "how does it work internally?" Security-sensitive implementation details are always an answer to the second question, never the first.

### Examples

**Simple endpoint:**

```md
# Health check

A simple internal endpoint used by monitoring systems to verify the platform is running. It returns a quick "ok" status. Not something end users ever see or interact with.
```

**Complex page:**

```md
# Edit a property

This is the most detailed management page for a property. Here, managers can update virtually everything about a property:

- **Location** — change or correct the property's address
- **Rooms** — add, edit, reposition, or remove rooms with their types and dimensions
- **Services** — add or remove utility services (electricity, gas, water, etc.)
- **Photos** — upload images of the property
- **Tags** — toggle category tags that describe the property's features

Only properties that aren't currently rented can be edited. The user needs editing permissions on that specific property to access this page.
```

**Webhook:**

```md
# Mercado Pago payment notifications

This is the endpoint that Mercado Pago calls whenever a payment status changes — for example, when a payment gets approved, rejected, or refunded. It's completely behind the scenes and not something users interact with.

When a payment is approved and it's related to a subscription, the system automatically extends the subscription period.
```

---

## technical.md

Explains **how** the route works for a developer maintaining or extending it.

### Heading

Always the route path: `# /admin/properties/[property_id]/edit`

### Sections by route type

Pick the sections that apply. Always include **Auth**.

#### Standard page (loader + actions)

```md
# /route/path

## Loader

Requires auth + `require_edit_access()`. Fetches `property` via `fetch_property()`. Returns 404 if not found.

## Actions

- `UPDATE_LOCATION` — updates property location
- `CREATE_ROOM` / `UPDATE_ROOM` / `DESTROY_ROOM` — full CRUD for rooms

All actions require `require_edit_access()`.

## Auth

Requires authenticated user with edit access (ACL) to the property.

## Key Components

LocationInput, RoomMap, Formulary

## Notes

- Some technical quirk worth knowing
```

#### Read-only page (loader, no actions)

```md
# /route/path

## Loader

Requires auth. Loads `candidate` via `fetch_candidate()`.

## Actions

None — read-only page.

## Auth

Requires authenticated user.
```

#### Client-only page (no +page.server.ts)

```md
# /route/path

## Page (`+page.svelte`)

Client-side only — no `+page.server.ts`. Uses `authClient.signIn.email()` from Better Auth client.

## Auth

No server-side auth check — this is a public page.

## Key Components

Content, Section, Button
```

#### API endpoint (+server.ts)

```md
# /route/path

## Endpoint (`+server.ts` — GET only)

Description of what it does.

### Subsections as needed (Flow, Parameters, Protections, Access control, Caching, etc.)

## Auth

None — public endpoint.

## Notes

- Technical details
```

#### Layout (+layout.server.ts)

```md
# /route/path (layout)

## Layout (`+layout.server.ts`)

- What the server layout loads

## Layout (`+layout.svelte`)

What the client layout renders.

## Key Components

Dashboard (Root/Section/Link)
```

#### Static/callback page (no server file, minimal logic)

```md
# /route/path

## Page (`+page.svelte`)

Static page — no loader, no server file. Displays confirmation message.

## Notes

- Callback URL from external service after some process
```

### Style rules

- Terse — no filler words
- Inline code for function names, variable names, constants, patterns (`safe_async`, `require_edit_access()`, `fetch_property()`)
- For complex pages with many actions, group them by domain:

```md
## Actions (18 total)

Contract: `UPDATE_CONTRACT`
Files: `CREATE_FILE`, `DESTROY_FILE`, `CREATE_PDF`
Items: `CREATE_CONTRACT_ITEM`, `UPDATE_CONTRACT_ITEM`, `DESTROY_CONTRACT_ITEM`
```

- Loader section mentions: auth requirements, what data is fetched (with function names), error conditions (404, 403), redirects
- Auth section always present — states requirements or "None" for public routes
- Key Components section optional — list major imported components from `$lib/components/`
- Notes section optional — technical quirks, integration details, patterns worth calling out

---

## When to create docs

- Every new route gets a `docs/` directory with both files before the route is considered complete
- When modifying a route's behavior (new actions, changed auth, new loader data), update the corresponding docs
- Layout routes (`+layout.server.ts` / `+layout.svelte`) get docs too
