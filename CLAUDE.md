# Habita — Agent Guide

Read the skill file linked in each entry **only when the task requires it**. The summaries here give enough context to know which ones to reach for.

---

## Always-On Rules

These apply to **every line of code you write**. Internalize the summaries; read the full skill when you need examples.

- **Coding guidelines** — `snake_case` everywhere (functions, variables). Standalone functions use `function` keyword; arrow functions only for framework handlers/callbacks. No non-null assertions (`!`). No `void expression` hacks for reactivity. Every `<Button>` needs an explicit `variant`. No magic numbers/strings. Inline single-use variables. Schemas/types/constants live in the file where they are used, never in sibling `.schemas.ts` files. Read [`.claude/skills/coding_guidelines/SKILL.md`](.claude/skills/coding_guidelines/SKILL.md) for the full list with examples.

- **Naming conventions** — `snake_case` variables/functions, `SCREAMING_SNAKE_CASE` constants, `PascalCase` types/components/snippets, `kebab-case` CSS classes. Never abbreviate (`organization` not `org`). Variables named after what produced them (`input_validation`, `transaction_error`). Function prefixes: `fetch_`, `create_`, `update_`, `destroy_`, `require_`, `display_`, `get_`, `compose_`, `handle_`, `is_`/`has_`. Error messages in Spanish. Read [`.claude/skills/naming_conventions/SKILL.md`](.claude/skills/naming_conventions/SKILL.md) for schema naming, ACTION constants, Kysely abbreviations.

- **Agent behaviour** — Push back when the user is wrong. Be direct, not diplomatic. Don't flip positions without a genuinely better argument. Never make implementation decisions without approval. Never guess — investigate. Validate against official docs before proposing. Always test after implementing. Read [`.claude/skills/agent_behaviour/SKILL.md`](.claude/skills/agent_behaviour/SKILL.md).

- **CLI conventions** — Always use `just` for project operations. Never raw `docker compose`, `npx`, or `pnpm` for project tasks. Check `just --list` first. Never add `2>&1` to redirect stderr. Use `just ssh run` for production server access. Read [`.claude/skills/cli/SKILL.md`](.claude/skills/cli/SKILL.md) for the full recipe reference (`just up`, `just db migrate`, `just lint format`, `just test e2e`, etc.).

- **Lib utilities index** — Before creating any new utility, check the index first to avoid duplication. When you add/remove/change any export in `apps/web/src/lib/`, update this file. Read [`.claude/skills/lib_utilities/SKILL.md`](.claude/skills/lib_utilities/SKILL.md) — it's a C-style header listing every function signature, type, constant, schema, domain type file, server utility, broker event/producer, cron job, fetcher, and seeder helper.

- **Styled system** — Before creating custom UI, check what already exists: `Dialog`, `Table`, `Formulary`, global link styles. Read [`.claude/skills/styled_system/SKILL.md`](.claude/skills/styled_system/SKILL.md) for usage examples of each.

---

## Architecture & System Design

How state, errors, and data validation are structured across the app.

- **System design** — Every new piece of state must declare: what it is, where it lives, and why. Options: `$state` (ephemeral), URL params (survives form submissions, linkable), database (cross-device), cookie (session), Redis/KV (caches, TTLs), env var (config). URL params over `$state` for anything that must survive `use:enhance`. Read [`.claude/skills/system_design/SKILL.md`](.claude/skills/system_design/SKILL.md).

- **Error handling** — Go-style `[error, result]` tuples everywhere. Functions never throw. `safe_async` wraps promises, `safe_sync` wraps synchronous code. Typed errors colocated with their utility function (constant + type in the same file). Actions return `[{ action_name: { input?, execution? } }, null]`. Callers always destructure, never `return await action()`. Templates use `has_action_error()`. Multiple DB operations = transaction. Read [`.claude/skills/error_handling/SKILL.md`](.claude/skills/error_handling/SKILL.md) for the complete reference with every pattern (actions, callers, templates, utilities, API routes, non-critical side effects, client-side logging).

- **Data validation** — Always validate non-type-safe sources (`response.json()`, `formData.get()`, `searchParams.get()`, `cookies.get()`, `localStorage.getItem()`, `JSON.parse()`) with Valibot. Inside actions: use `normalize_input` + `v.safeParse`. Outside: use `v.parse`. `JSON.parse` always inside `v.transform` or `safe_sync`. Locally constructed data uses `satisfies`, not `v.parse`. Read [`.claude/skills/data_validation/SKILL.md`](.claude/skills/data_validation/SKILL.md).

- **Vite HMR singletons** — Module-level instances (DB clients, Kafka, Redis, EventEmitters) must survive HMR. Use `globalThis.__name ??= make_thing()` with an `as Type` cast. Defer initialization via Proxy for modules imported by routes (SvelteKit build-time caveat). Read [`.claude/skills/vite/SKILL.md`](.claude/skills/vite/SKILL.md).

---

## Server-Side Patterns

How server actions, data loading, and authorization work.

- **Actions** — All new functionality is added as SvelteKit named actions. Each route defines an `ACTION` constant in `actions/action.ts`. Each action is a modular function in its own `.server.ts` file returning Go-style `[errors, data]` tuples. `v.safeParse` for validation (never `v.parse`), `safe_async` for DB. One file per action, no barrel exports. Read [`.claude/skills/actions/SKILL.md`](.claude/skills/actions/SKILL.md) for the full pattern with caller examples, file organization, and how it connects to error handling.

- **Loaders** — Every database call wrapped in a `fetch_` prefixed function using `query_builder`. Read [`.claude/skills/loaders/SKILL.md`](.claude/skills/loaders/SKILL.md).

- **Security** — Better Auth with SvelteKit. `require_authentication(locals)` narrows user/session to non-null. Two-layer authorization: RBAC via Better Auth roles + ACL via `property_access` table. Helpers: `require_view_access()`, `require_edit_access()`, `require_landlord_access()`, `get_accessible_property_ids()`, `assign_property_access()`, etc. Read [`.claude/skills/security/SKILL.md`](.claude/skills/security/SKILL.md).

---

## Frontend & UI

How to build the UI layer — components, forms, layout, styling, and design-to-code.

- **Svelte** — Use Svelte 5 snippets (`{#snippet Name()}`) to organize page sections when 3+ exist. Use the Svelte MCP server for documentation: `list-sections` first, then `get-documentation`, then `svelte-autofixer` on every Svelte code before finishing. Read [`.claude/skills/svelte/SKILL.md`](.claude/skills/svelte/SKILL.md).

- **Layout** — Use `Content` for every foundational route structure. Use `Formulary` for all form interfaces. Read [`.claude/skills/layout/SKILL.md`](.claude/skills/layout/SKILL.md).

- **Forms** — Always use `Formulary`. No exceptions. If it can't handle something, ask the user. Read [`.claude/skills/forms/SKILL.md`](.claude/skills/forms/SKILL.md).

- **Frontend conventions** — Dialogs: always native `<dialog>` with `.showModal()` / `.close()`. Backdrop click via `event.target === dialog_element`. No custom modals, no portals, no CSS visibility toggling. Read [`.claude/skills/frontend_conventions/SKILL.md`](.claude/skills/frontend_conventions/SKILL.md).

- **Styling** — Native CSS inside `.svelte` files. Short local class names (no BEM). CSS nesting for parent/child. No Tailwind. For reusable components and global styles, see styled system. Read [`.claude/skills/styling/SKILL.md`](.claude/skills/styling/SKILL.md).

- **Design (Figma-to-code)** — File key: `pwgsZM9ts0fJjczhT6bx5B`. Components page: `427:274`. Workflow: screenshot -> design context -> variable defs -> check existing components -> implement. Never hardcode values — use tokens from `tokens.css`. Never inline font properties — use text style classes from `text_styles.css` (`.heading-lg`, `.body-md-medium`, etc.). Design system components in `$lib/components/`, page-specific in `routes/.../components/`. Read [`.claude/skills/design/SKILL.md`](.claude/skills/design/SKILL.md) for the full component inventory, text style table, Figma MCP tool guide, and workflow checklist.

---

## Infrastructure & Tooling

How to manage the database, Docker, runtime, config files, and git.

- **Database** — `just db make <name>` to create migrations, `just db migrate` to run, `just db types` to refresh types, `just db seed` to seed, `just db reset` to start fresh. Seed location data must be verified against local Nominatim. Read [`.claude/skills/database/SKILL.md`](.claude/skills/database/SKILL.md).

- **Docker** — Never use `-f` flag with `docker compose` (`COMPOSE_FILE` env var handles it). Service names describe function, not technology: `db` not `postgres`, `kv` not `valkey`, `object` not `minio`, `broker` not `redpanda`. Read [`.claude/skills/docker/SKILL.md`](.claude/skills/docker/SKILL.md).

- **Runtime** — Use `pnpm` for dependencies. Use `node:` prefix for Node.js APIs. Read [`.claude/skills/runtime/SKILL.md`](.claude/skills/runtime/SKILL.md).

- **Config** — Config files live in `config/` directories, symlinked to root. Run `just link` after adding a new config file. Exception: `.gitignore` stays at root. Read [`.claude/skills/config/SKILL.md`](.claude/skills/config/SKILL.md).

- **Git** — Conventional commits: `type(scope): description`. Always one line, all lowercase, no period, no trailers (no `Co-Authored-By`). Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`, `ci`, `deploy`. Scope is the domain (`notifications`), not the file path. Read [`.claude/skills/git/SKILL.md`](.claude/skills/git/SKILL.md) for the full example list from the repo history.

---

## Process & Planning

- **Planning** — Be extremely concise. All plans are multi-phased. Stop after each phase and wait for user confirmation. Use `AskUserQuestion` for clarifications. After finishing a phase, run `just lint types`. Only run `just lint types` and `just lint format` when user explicitly asks. Read [`.claude/skills/planning/SKILL.md`](.claude/skills/planning/SKILL.md).

---

## Business & Strategy

Non-code skills for product and market discussions.

- **Business strategy** — Pricing model (Freelancer $35/mo, Company $50/seat/mo, annual = 2 months free). Differentiator: full rental lifecycle in one tool (listing -> visits -> contract -> signature -> payment). Competitor landscape. Unit economics ($50/mo infra, break-even at ~25 users). MercadoPago integration. Angel investment only. Read [`.claude/skills/business_strategy/SKILL.md`](.claude/skills/business_strategy/SKILL.md).

- **Go-to-market** — Beachhead: freelancers, dueños directos, and small agencies in CABA. Tier 1 channels: in-person visits + WhatsApp/LinkedIn outreach + personal network. Pitch templates per channel and user type. Revenue math to $5,000 MRR. Read [`.claude/skills/go_to_market/SKILL.md`](.claude/skills/go_to_market/SKILL.md).

- **UX** — Adopt the mindset of a 20+ year UX expert. Sources: Nielsen's 10 heuristics, Norman's design principles, Krug's usability rules, Laws of UX, WCAG 2.2, WAI-ARIA APG, Shneiderman's 8 golden rules, Morville's honeycomb. 32-item checklist: component-level (11 items), page-level (20 items), flow-level (all 32). Read [`.claude/skills/ux/SKILL.md`](.claude/skills/ux/SKILL.md) for the full checklist and framework descriptions.

---

## Modes

- **Chat mode** — When the user says "chat mode", switch to a 20+ year staff engineer in a casual but rigorous peer discussion. Be direct, opinionated, concise. No code until we agree to start building. Challenge ideas, think out loud, surface risks. Read [`.claude/skills/chat_mode/SKILL.md`](.claude/skills/chat_mode/SKILL.md).
