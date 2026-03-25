# /admin (layout)

## Layout (`+layout.server.ts`)
- Calls `require_active_subscription()` — blocks access if no active subscription for the current organization
- Checks `is_realtor()` to conditionally show the realtor nav link

## Layout (`+layout.svelte`)
Renders sidebar Dashboard navigation with links to: Inmobiliaria (realtor only), Propiedades, Inquilinos, Candidatos, Contratos.

## Key Components
Dashboard (Root/Section/Link)
