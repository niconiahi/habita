---
name: business_strategy
description: Business Strategy. Use when discussing pricing, monetization, competitive positioning, unit economics, or any business-level decisions about Habita.
---

# Business Strategy

When discussing business strategy, adopt this role:

## Role

- You are a business expert, specialist in startups and small-size companies, with more than 20 years of experience in the field
- Be direct and opinionated — no hedging or corporate speak
- Challenge ideas when they don't hold up, back it up with reasoning and real-world precedent
- Think out loud — share trade-offs, risks, and market dynamics
- Reference concrete examples from companies that faced similar decisions
- Keep responses conversational — this is a peer discussion, not a consulting deck
- Surface risks and "what about..." scenarios proactively

## Pricing Model

### Monthly + Annual billing

The pricing page uses a `SegmentedButton` to toggle between "Mensual" and "Anual"

### Freelancer (solo property manager)
- **Monthly**: $35/month
- **Annual**: $350/year (2 months free vs monthly)
- 1 user, no team features
- 30-day free trial on signup

### Company / Realtor (agency with team)
- **Monthly**: $50/seat/month
- **Annual**: $500/seat/year (2 months free vs monthly)
- 30-day free trial on signup (limited to 1 manager during trial)

### Pricing Principles
- Company seats are more expensive than solo plans (companies extract more value, higher willingness to pay)
- Annual discount is 2 months free (~17%) — industry standard SaaS incentive
- Annual plans reduce churn and provide upfront cash

## Differentiator

### The full rental lifecycle, in one tool

Today, an Argentine property manager juggles multiple tools:
- A **marketplace** (Zonaprop, Argenprop) for visibility — where tenants search
- A **CRM** (Tokko, 2clics, Adinco) for leads — tracking inquiries, managing contacts, syndicating listings to marketplaces
- A **management tool** (Inmosoft, Xintel) for post-signing admin — receipts, accounting, contract indexation
- **WhatsApp** for everything in between

None of these tools connect. The CRMs stop when the deal is signed. The management tools start after. Nobody handles the middle: visit scheduling, candidate evaluation, contract drafting, digital signing.

**Habita replaces the entire stack.** One platform that covers:
1. Property listing and tenant browsing (marketplace)
2. Visit scheduling and candidate management (CRM)
3. Contract drafting with Argentine-specific legal requirements — IPC/ICL escalation, warranty types (property, income, surety)
4. Digital signing via Alpha2000
5. Rent collection and payment tracking (management)

The value proposition: **one tool instead of four, from listing to monthly payment.**

### Argentine Competitors (direct)

#### Comparison table

| Herramienta      | Publicación | Visitas | Contratos | Firma digital | Pagos   |
|------------------|-------------|---------|-----------|---------------|---------|
| [Zonaprop](https://www.zonaprop.com.ar)             | Sí      | No  | No      | No  | No  |
| [Argenprop](https://gestion.argenprop.com)           | Sí      | No  | No      | No  | No  |
| [2clics](https://2clics.app)                         | Sí      | No  | No      | No  | No  |
| [Tokko Broker](https://www.tokkobroker.com/es-ar)    | Sí      | No  | No      | No  | No  |
| [Inmosoft](https://www.inmosoft.com.ar)              | No      | No  | Parcial | No  | Sí  |
| [Barreeo](https://barreeo.com)                       | No      | No  | Parcial | No  | Sí  |
| [Tus Alquileres](https://tusalquileres.com.ar)      | No      | No  | Parcial | No  | Sí  |
| [RentaControl](https://www.rentacontrol.com.ar)      | No      | No  | Parcial | No  | Sí  |
| [Ubiquo](https://www.ubiquo.com.ar)                  | Parcial | No  | Parcial | No  | Sí  |
| [SPOT](https://spot.net.ar)                           | No      | No  | Parcial | No  | Sí  |
| **Habita**                                            | **Sí**  | **Sí** | **Sí** | **Sí** | **Sí** |

#### Tooltips for "Parcial" values

**Publicación — Ubiquo**: Diseña sitio web de la agencia donde se listan propiedades. No es un marketplace con búsqueda y filtros para inquilinos

**Contratos — todos los "Parcial"**:
- **Barreeo**: Carga de contratos existentes. Calcula aumentos IPC/ICL y punitorios. No redacta contratos
- **SPOT**: Carga de contratos con IA. Extrae datos del PDF. No redacta contratos
- **RentaControl**: Administración de contratos existentes. Liquidaciones y recibos. No redacta contratos
- **Tus Alquileres**: Gestión de contratos existentes. Impresión de pagarés. No redacta contratos
- **Ubiquo**: Carga de datos precontractuales. Automatiza índices y pagos. No redacta contratos
- **Inmosoft**: Administración de contratos. Recibos, liquidaciones, indexación. No redacta contratos

**Habita (Sí en contratos)**: Redacción completa del contrato dentro de la plataforma: escalación por IPC/ICL, 3 tipos de garantía, períodos de precio, inventario de objetos, generación de PDF

#### Competitor categories

**Marketplaces + CRMs** (pre-alquiler): Zonaprop, Argenprop, 2clics, Tokko Broker
- Publican propiedades y gestionan contactos/leads
- Se frenan cuando se firma el contrato
- Pricing: Zonaprop per listing, Argenprop free, 2clics $49K-$142K ARS/mo, Tokko hidden

**Administration tools** (post-alquiler): Inmosoft, Barreeo, Tus Alquileres, RentaControl, Ubiquo, SPOT
- Cargan contratos existentes, calculan aumentos, generan recibos y liquidaciones
- No publican, no agendan visitas, no redactan contratos, no firman digitalmente
- Pricing: Inmosoft free-$99K ARS/mo, Barreeo $7.5K-$48.5K ARS/mo, rest hidden

**Firma digital — distinction**:
- **Firma digital** (Ley 25.506): certificado emitido por licenciado certificador autorizado por el estado. Misma validez que firma manuscrita. Carga de la prueba recae en quien la impugna. Habita usa Alpha2000
- **Firma electrónica**: cualquier método electrónico de firma. Validez legal pero más débil — la carga de la prueba recae en quien se apoya en ella. SPOT usa Signia (firma electrónica, no firma digital)
- Ningún competidor tiene firma digital real. Solo Habita

#### Key insight
Ningún competidor cubre el ciclo completo. Los CRMs cubren pre-alquiler. Las herramientas de administración cubren post-alquiler. Nadie cubre el medio: visitas, evaluación de candidatos, redacción de contrato, firma digital. Habita es el único que conecta todo

## Market Context

### Competitive Landscape (LATAM)
- **No pure-SaaS property management platform** purpose-built for LATAM at a subscription price
- LATAM competitors (QuintoAndar, Houm, Aptuno) are marketplace-hybrids charging 8-10% of rent (commission model)
- Tokko Broker (Argentina) is a CRM, not a full rental lifecycle tool
- Habita's flat subscription is significantly cheaper than commission-based alternatives

### Global "Big Boys" (for reference, not direct competitors)
- Yardi (~$1.6B/yr), RealPage (~$1.15B), AppFolio ($951M/yr), Entrata ($503M/yr), MRI (~$1B/yr)
- All use per-unit/month pricing ($1-5/unit) targeting US market
- Total global market: ~$6.5B, LATAM market: ~$213M

## Unit Economics
- Current total infrastructure cost: ~$50 USD/month
- Break-even with ~25 users on monthly subscription plans

## Payment Integration

### Subscription: Mercado Pago Preapproval (auto-recurring)
- Used for both freelancer and company subscriptions
- User sets up card once, auto-charges monthly — set and forget
- Mercado Pago handles retries on failed payments (up to 4 times over ~10 days)
- On failed payment webhook: transition to GRACE, show banner, notify user
- On successful retry: back to ACTIVE automatically
- On all retries exhausted: LOCKED
- The existing ACTIVE → GRACE → LOCKED flow and `ends_at` computation still works — Preapproval just keeps extending `ends_at` on each successful charge
- **Replaces** the current manual renewal flow (no more reminder emails + manual "Pagar" click)

### Annual: Mercado Pago Checkout Preferences
- Used for both freelancer and company annual plans
- Single payment via `/checkout/preferences` API — already implemented
- On success: set `ends_at` to 1 year from now

## Funding

### Angel investors only
- No VC, no accelerators — angel investment only
- Angels bet on people and products, not spreadsheets
- Habita's strongest asset for angels: a fully working MVP (not a Figma mockup)

### Pitch Deck (10 slides, for investors)
A pitch deck is **only for investors** (angels, VCs). It's not a sales tool for customers.

Structure:
1. **Problem** — "Argentine property managers use 4 disconnected tools to manage one rental"
2. **Solution** — "Habita: the full rental lifecycle in one platform"
3. **Demo / Product** — screenshots or GIF showing the journey: property → visit → contract → signature → payment
4. **Market** — LATAM property management: $213M. Argentina: ~15,000 agencies. 500 agencies × $50/seat × 3 avg seats = $900K ARR
5. **Competition** — the competitor table from this doc. "They each do a piece. We do it all."
6. **Business model** — monthly + annual billing, 2 months free on annual
7. **Traction** — MVP built, features shipped, beta users / waitlist if any
8. **The Ask** — specific amount + what it funds. "$30K for 6 months infra + marketing to reach 50 paying users" > "$100K for growth"
9. **Team** — founder background. Solo technical founder who built the whole thing = strong signal
10. **Vision** — "The operating system for rental management in LATAM"

### Sales Materials (for customers — separate from pitch deck)
These target property managers and agency owners, not investors. Different audience, different language.

| Material | Purpose | Language |
|----------|---------|----------|
| **Landing page** | #1 tool. Salesperson 24/7. Where trials start | "Ahorrá tiempo," "todo en un lugar" |
| **Demo video** | 2-3 min screencast of the full lifecycle | Show, don't tell |
| **One-pager PDF** | Single page a prospect can forward to their partner | Simple, visual, persuasive |
| **WhatsApp outreach** | In Argentina, this is how B2B small business sales happen | Direct, personal |

Key difference: investors care about market size, traction, and team. Customers care about "does it work, how much, is it easy."

## Resolved Decisions
- **Annual discount**: 2 months free (10 months for the price of 12)
- **No one-time/lifetime option**: replaced by annual billing with discount
- **Transition freelancer → realtor**: not a concern for now
