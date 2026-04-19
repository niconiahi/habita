---
name: system_design
description: System design conventions. Use always when introducing any new state — covers where to persist it and why.
---

# State Persistence

Whenever you introduce new state — client, server, or infrastructure — you MUST explicitly state where it will be persisted and why. No implicit defaults.

## Decision framework

For every piece of state, answer:

1. **What is it?** — name and purpose
2. **Where does it live?** — pick from the options below
3. **Why there?** — justify with at least one of: survivability, shareability, scope, or consistency

## Persistence options

| Location | Survives reload | Shareable | Scope | Use when |
|---|---|---|---|---|
| Component state (`$state`) | No | No | Single component | Ephemeral UI state (open/closed, hover, animation) |
| URL search params (`?key=value`) | Yes | Yes | Route | UI state that should survive form submissions and be linkable |
| URL path segment (`/thing/[id]`) | Yes | Yes | Route | Primary resource identity |
| Cookie | Yes | No | Browser session | Auth tokens, preferences, theme |
| Database column | Yes | Yes | System-wide | Business data, anything that must persist across sessions and devices |
| Server session (`locals`) | Request only | No | Single request | Derived auth/permission data per request |
| Redis/KV | Configurable TTL | No | System-wide | Caches, rate limits, ephemeral server state |
| Environment variable | Yes | No | Process | Configuration, secrets, feature flags |

## Rules

- **No unnamed state.** If you add a `$state`, a column, a cookie, or a query param — name it in your plan before writing code.
- **No silent defaults.** Don't just pick `$state` because it's easy. If the state matters after a page reload or form submission, it doesn't belong in component state.
- **URL params over component state** for anything that should survive `use:enhance` form submissions, since those re-run the load function and re-render the page.
- **Database over URL** for anything that should be consistent across devices or users.
