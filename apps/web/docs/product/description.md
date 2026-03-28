# Habita — Product description

Habita is a rental property management platform built for the Argentine real estate market. It connects three types of users — property managers, landlords, and tenants — through a single system that handles property listing, visit scheduling, contract drafting, digital signing, and payment tracking.

This document describes how the platform works as a whole — the interconnections, lifecycles, and flows that can't be captured by any single route's documentation. For what each individual page does, see the colocated `docs/description.md` inside each route.

---

## The three actors and how they relate

The platform serves three roles, each with different capabilities and different entry points into the system:

- **Property managers** (freelance or part of a real estate agency) are the operators. They create property listings, schedule visit availability, review candidates, draft contracts, configure pricing periods, and manage tenants. They pay a monthly subscription to access the admin tools. A freelance manager works alone; an agency manager is part of a team led by a realtor.
- **Landlords** are property owners. They don't manage day-to-day operations — a manager does that on their behalf. Landlords are invited into the system via email with a time-limited token, linked to specific properties, and their main interactions are reviewing contract details and signing contracts digitally. A landlord never creates a property or manages tenants — they delegate that entirely.
- **Tenants** are renters. They browse properties, book visits, and once accepted, they view their contract details and upload payment receipts. Tenants don't pay for the platform — they use it for free. Their entry into the system is either organic (signing up to browse) or prompted (a manager promotes them after a visit).

The key relationship triangle: a manager operates on behalf of a landlord, publishes a property, and a tenant interacts with that published property. The three actors converge on the contract — the manager drafts it, the landlord signs it, and the tenant signs it. This is the only point in the system where all three roles are required simultaneously.

---

## The property as the central entity

A property is the nucleus of the system. Nearly every other entity in the database references back to it, either directly or through a chain of foreign keys:

- **Rooms** (bedroom, bathroom, kitchen, living room, dining room) define the internal layout. Each room has a type, width, and length. Rooms can be positioned on a visual map via x/y coordinates, creating a floor plan representation.
- **Services** (municipal fees/ABL, water, light, gas) track which utilities are connected to the property. Each service has a type and a code identifier. Services later reappear in the tenant's contract view as receipt categories — when a tenant uploads a payment receipt, they choose whether it's for rent or for a specific service type.
- **Photos** are the only property file type currently. They're encrypted at rest and served through the file endpoint with access control.
- **Tags** describe property features across seven categories: unit characteristics (rear-facing, brand new), room features (balcony), building amenities (elevator, ramp, storage, garage), equipment (furnished, fridge, gas stove, water heater, electric stove), climate control (AC, balanced draft, gas heater), shared amenities (pool, common room, security, gym), and pet policy (cat-friendly, dog-friendly). Tags are toggled on/off and power the filtering system on the public listing page.
- **Location** places the property geographically. Addresses are geocoded through Nominatim and stored as PostGIS geometry points. The location includes structured data: road, house number, suburb/neighborhood, city, town, and state/province.
- **Destinies** define what the property is intended for — residential or commercial. A property can have multiple destinies.
- **Construction year** is an optional metadata field.

A property moves through three states that gate what can be done with it:

- **Editing** — the property is being prepared. All editing actions are available: rooms, services, photos, tags, location, destinies, construction year, and landlord invitations. The property is not visible to tenants.
- **Published** — the property is live on the public listing. The visit calendar becomes available, tenants can browse and book visits, and the manager can start creating contracts. Editing is still possible — the manager can update rooms, photos, tags, and other details while the property is listed.
- **Rented** — the property has an active lease. Editing is locked, the visit calendar is closed, and the property is no longer shown in the public listing. The contract and tenant management views remain active.

The transition from editing to published (and back) is a manual action by the manager. The transition to rented happens implicitly when a contract is activated through digital signing.

---

## From stranger to tenant: the full journey

The platform's core value is turning a stranger browsing properties into a tenant with a signed contract. Here is every step in that pipeline and what happens at each one:

### Step 1 — The tenant signs up

A new user creates an account with name, surname, email, and password (minimum 8 characters), or signs up with Google OAuth. Behind the scenes, Better Auth creates the user record, an OAuth account link, a 30-day session, and automatically generates a personal organization for the user.

### Step 2 — Onboarding: choosing an account type

Immediately after signup, the user lands on the onboarding page and picks one of three account types:

- **Tenant** — redirects to the profile page to complete personal information. No subscription is created; tenants use the platform for free.
- **Freelance** — creates a subscription (30-day free trial) for the user's personal organization with type FREELANCE. Redirects to the admin area.
- **Real estate agency** — creates a subscription (30-day free trial) with type REALTOR. Redirects to the admin area.

This choice determines everything downstream: what the user sees in the navigation, whether they need a subscription, and what role they play in the authorization system.

### Step 3 — Profile completion

The tenant fills in their profile: name, surname, phone number (Argentine E.164 format: +549XXXXXXXXXX), national ID number (documento), and CUIL. All of these fields are encrypted at rest using AES-256-GCM. They also upload documents — critically, a **credit report** (informe crediticio), which is a prerequisite for booking property visits. Without it, the "Book" button on property detail pages won't work. The platform has a built-in help article explaining what's needed and why.

### Step 4 — Browsing properties

The public property listing page shows all published properties. Tenants can filter by:
- **Zone/neighborhood** — uses PostGIS spatial queries (`ST_Contains`) to match the property's geocoded point against zone boundary geometries.
- **Tags** — any combination of the 21 property tags across 7 categories.
- **Service types** — filter by which utilities are connected.
- **Room counts** — minimum/maximum total rooms, bedrooms, or bathrooms.
- **Surface area** — minimum/maximum total area (calculated from room dimensions).
- **Construction year** — minimum/maximum range.

Each property card shows a photo carousel, location, and monthly price (from the latest contract period). Clicking through opens the full detail page with the room map, photo gallery, address breakdown, and the "Book" button.

### Step 5 — Booking a visit

The "Book" button leads to a two-step process. First, the tenant picks a date from available options — these are days where the manager has created free time slots in the property's calendar. Then they pick a specific time slot and confirm.

What happens in the system when a slot is reserved:
1. The slot's state changes from FREE to RESERVED, and the tenant's user ID is recorded as the visitant.
2. A **database notification** is created (type: PROPERTY_VISIT, linking to the candidates page) so the manager sees it in the admin panel.
3. A **booking confirmation event** is published to the Redpanda broker. The producer composes the full email — including an ICS calendar attachment with the visit date and time — for both the tenant (visitant) and the manager (host). The consumer validates the payload and delivers both emails through the Go SMTP service.

This is a key interconnection point: a single user action (booking) touches the slot table, the notification table, and the broker, producing effects visible in three different parts of the system (the calendar, the notification bell, and both parties' email inboxes).

### Step 6 — Candidate review

In the admin panel, candidates appear in two places: scoped to a specific property (showing who booked visits for that property) and across all properties (a bird's-eye view). A candidate is defined as any user who has a RESERVED slot on one of the manager's properties.

The manager can click into a candidate's profile to review their personal information and uploaded documents (credit report, ID, income proof). The system enforces that a manager can only see candidates who have reserved slots on properties they manage — there's no way to browse candidates from other managers' properties, even within the same organization.

### Step 7 — Promoting a candidate to tenant

When a manager decides to accept a candidate, they promote them to tenant status. This is a transactional operation:
1. All existing TENANT access entries for the property are revoked (a property can only have one active tenant at a time in the access table).
2. The candidate is granted TENANT access to the property.

This doesn't create a contract — it establishes the relationship. The candidate's user record hasn't changed; what changed is their access type on the `property_access` table, which unlocks the tenant-facing views.

### Step 8 — Contract creation

Contracts can be created from two entry points: from a specific property's management page (the property is pre-selected) or from the global contracts section (where the manager first picks a property). Either way, the result is a new contract record in EDITING state, linked to the property.

The manager then configures the contract in the comprehensive edit page, which supports over 20 distinct actions:

**Core contract fields:**
- Contract type (short-term or long-term)
- Start and end dates
- Destiny (residential or commercial)
- CBU (bank account for rent payments)
- Court ID (for legal jurisdiction)
- Showroom hours
- Early termination conditions
- Percentage return

**Pricing periods** define how rent changes over time. Each period has a price and date range. The manager creates multiple periods to represent rent increases throughout the contract's duration.

**Escalation rules** determine how rent is automatically adjusted based on official Argentine rate indexes. Two escalation types are supported:
- **IPC** (Índice de Precios al Consumidor) — formula: `price × (IPC_current_month / IPC_four_months_ago)`
- **ICL** (Índice de Contratos de Locación) — formula: `price × (ICL_current_month / ICL_four_months_ago)`

Each contract specifies an escalation type and duration. A cron job runs every minute, checking if any active contracts are due for escalation, and publishes a `calculate_escalation` event to the broker. The consumer recalculates rent based on the current rate values stored in the `rate` table.

**Fines and defaults** handle late payments and contractual breaches:
- Fine type: fixed amount or percentage of rent
- Default type: fixed amount or percentage of rent
- Default duration: how long before a default is triggered

**Warranty/guarantee** — Argentine rental law requires tenants to provide a guarantee. The system supports three types, each with different data requirements:

1. **Property warranty (Garantía Propietaria)** — a guarantor offers a property as collateral. Requires: guarantor name/DNI/email, a geocoded property location, cadastral data (district, section, block, parcel), and a property tax ID. The location uses the same Nominatim search as property creation.
2. **Income warranty (Recibo de Sueldo + Informe Comercial)** — guarantors vouch with their income. The warranty itself has no fields beyond type; instead, it has child **income guarantors** (one or more), each with name, DNI, and email. Guarantors can be added, updated, and removed independently.
3. **Surety warranty (Seguro de Caución)** — an insurance company backs the rental. Requires: guarantor name/DNI/email, insurance company name, policy number, and company email.

The warranty system uses a polymorphic pattern: a base `warranty` table with a type discriminator, and three specialized tables (`property_warranty`, `income_warranty`, `surety_warranty`) that extend it. A contract links to one warranty via `warranty_id`.

**Contract items** are individual clauses or line items in the contract. Each item has a name and a state (good or defective — used for inventory items like appliances or furniture that come with the property). Items can have files attached to them (photos of items, condition reports).

**Contract files** are documents attached to the contract itself. Three types: contract documents, insurance documents, and signed contract PDFs.

### Step 9 — PDF generation

Before a contract can be sent for digital signing, it needs to be turned into a PDF. The system:
1. Fetches all contract data (contract, property, landlord, tenant, warranty).
2. Validates that all required fields are present.
3. Composes an HTML document with all contract details.
4. Sends the HTML to a Playwright-based PDF generation service.
5. Encrypts the resulting PDF and stores it in the file table as a CONTRACT type.

If a previous contract PDF exists, it's replaced. This ensures the PDF always reflects the latest contract state.

### Step 10 — Digital signature flow

The digital signature process integrates with Alpha2000 Firmador, an Argentine digital signature provider. It's a multi-step process with several prerequisite checks:

**Certificate verification** — Before anything can be signed, the manager checks whether the landlord and tenant have digital certificates. This requires both parties to have CUIL numbers in their profiles. The system calls `check_certificate(cuil)` for each person.

**Onboarding** — If either party lacks a certificate, the manager can initiate the onboarding process. This redirects the person to Alpha2000's onboarding flow, where they set up their digital identity. The redirect includes callback URLs pointing to the platform's onboarding webhook, which handles success, error, and rejection outcomes.

**Sending for signing** — Once both parties have certificates, the manager sends the contract for signing. The system:
1. Fetches the contract PDF from the file table.
2. Generates a SHA-256 hash of the PDF content.
3. Creates a random UUID as the signing group identifier.
4. Calls the Alpha2000 API with the base64-encoded PDF, the hash, the group ID, and both signers (landlord first, tenant second) with their CUILs and redirect URLs.
5. Stores the digital signature record in the database with the document ID, group ID, signing URLs for each party, and PENDING status for both.
6. Publishes a `send_signing_request` event to the broker, which delivers HTML emails to both parties with links to sign.

**Signing** — Each party clicks their link, gets redirected to Alpha2000's signing interface, and completes or rejects the process. After signing, Alpha2000 redirects them back to the platform's signing webhook.

**Webhook processing** — The signing webhook receives the party (landlord/tenant), the result (ok/error/rejected), and the contract ID. It updates the corresponding status in the `digital_signature` table. Then it checks: have both parties signed successfully? If yes, the system:
1. Calls Alpha2000 to download the fully signed PDF document.
2. Encrypts the signed PDF.
3. In a single transaction: stores the file, creates a contract file record of type SIGNED, and updates the contract state from EDITING to ACTIVE.
4. Redirects the user to the success page.

This is the moment where the contract becomes legally binding. The transition from EDITING to ACTIVE is entirely automated — no manual "activate" button exists.

**Signature verification** — After signing, the manager can verify each party's signature by fetching the signed document, the original hash, the signer's certificate, and calling Alpha2000's verification API.

### Step 11 — Tenant's ongoing interaction

Once a contract is active, the tenant accesses their contract view. This page shows the current rent price (derived from the latest pricing period by start date) and lets them upload payment receipts. Receipt types mirror the property's services: rent, municipal fees (ABL), water, light, and gas. Each receipt is an encrypted file linked to the contract.

The page shows receipts from the last two months, giving both the tenant and manager a rolling window of recent payment activity. This is the tenant's primary ongoing touchpoint with the system.

---

## The manager's operational world

While the stranger-to-tenant pipeline describes the main flow, managers spend most of their time in the admin area, which provides several cross-cutting views:

### All contracts

A global list of every contract across all the manager's properties, filterable by state (editing, active, finished). From here, managers can change a contract's state and navigate to individual contracts for editing. This view exists because a manager might handle dozens of properties and needs a way to find a specific contract without drilling through the property hierarchy.

### All tenants

A flat list of every tenant across all managed properties, showing name, email, and which property they're associated with. This is a convenience view — the same information is accessible through individual properties, but having it in one place helps managers who need to look up a specific person quickly.

### All candidates

Every person who has booked a visit to any managed property, in one list. Managers can promote candidates to tenant status directly from here, without navigating to the specific property first.

### Agency management (realtors only)

Real estate agency owners have an additional management page where they can:
- **Invite managers** — send email invitations to bring new team members into the agency. During the free trial, this is limited to 1 manager beyond the realtor themselves.
- **Remove managers** — revoke a manager's access. This is a transactional operation that removes both their property access entries and their organization membership.
- **Reassign properties** — move a property from one manager to another within the agency. This revokes all MANAGER access for the property and optionally assigns a new manager.

The page also shows a dashboard of all managers with their property counts, giving the realtor visibility into workload distribution.

---

## Authorization: two layers, not one

Access control in Habita is not a simple role check. It's a two-layer system that must be understood as a whole, because neither layer alone is sufficient:

**Layer 1 — Role permissions (Better Auth RBAC)**: What *type* of action can this role perform? Four roles are defined:
- **Realtor** — full organization management plus property/contract/tenant read and write.
- **Manager** — admin-level organization access plus property/contract/tenant read and write.
- **Landlord** — owner-level organization access plus property/contract/tenant read and write.
- **Tenant** — property read and contract read only. No write permissions.

These are checked via Better Auth's `hasPermission()` API with permission statements like `{ property: ["read"] }` or `{ property: ["write"] }`.

**Layer 2 — Property assignment (ACL)**: Is this *specific user* linked to this *specific property*? The `property_access` table has three columns that matter: `property_id`, `user_id`, and `type` (0=landlord, 1=manager, 2=tenant). A `granted_by` column maintains an audit trail of who granted the access.

Both layers must pass for any operation. The system provides convenience wrappers:
- `require_view_access()` — checks LANDLORD, MANAGER, or TENANT access with read permission.
- `require_edit_access()` — checks LANDLORD or MANAGER access with write permission.
- `require_landlord_access()` — checks LANDLORD access only.
- `get_accessible_property_ids()` — returns the list of property IDs a user can access, used for scoping all listing queries.

This two-layer model prevents several classes of bugs: a manager from agency A can't access agency B's properties (layer 2 blocks it), and a tenant can't modify a property even if they somehow have a property_access entry (layer 1 blocks write permissions for tenants).

Every admin listing page — properties, contracts, tenants, candidates — starts by calling `get_accessible_property_ids()` to scope its database queries. There's an explicit guard for the empty case: if a user has no accessible properties, the query returns an empty result rather than failing on an invalid `WHERE IN ()` clause.

---

## Organizations, teams, and the subscription gate

### Organization structure

Every user belongs to at least one organization. The type of organization determines the billing model, team capabilities, and administrative structure:

- **Personal organizations** — created automatically for every user at signup (`personal-{user_id}` slug). For freelance managers, this is their working organization. For tenants, it exists but is invisible. For agency managers, it's overshadowed by their agency membership.
- **Agency organizations** — created when a realtor selects the "real estate agency" account type. The realtor is the owner. Managers are invited in and join as members. The organization has a team structure where properties are assigned.

Organizations are the unit of subscription billing. The `subscription` table links to both a user and an organization. For freelancers, there's one subscription row. For agencies, there's one row per seat (per manager), all sharing the same `organization_id`.

### Team structure

Within an agency organization, teams group properties. There's a default "Principal" team that can't be deleted. When managers are invited, they join a team. When properties are reassigned between managers, they move within the team structure. Teams exist primarily to support the property-to-manager assignment model — they're the organizational unit that connects a set of properties to a set of people.

### Subscription lifecycle

The subscription system has three states, computed from dates rather than stored as a column:

- **Active** — `ends_at > now`. Full access to the admin area.
- **Grace** — `ends_at <= now < ends_at + 7 days`. An unclosable warning banner appears for all organization members, but admin access continues. The banner shows "Tu suscripción vence en X días" and links to the renewal page.
- **Locked** — `now >= ends_at + 7 days`. Every request to the admin layout throws a redirect to `/subscribe`. The user can still log in, view public pages, and access the subscription page to pay.

Computing status from dates instead of storing it eliminates a class of race conditions — there's no cron job needed to flip a "status" column, and the value is always correct at read time.

### Payment flow

1. The manager visits `/subscribe`, which calculates the amount due: $50 USD for freelancers, $40 USD × seat count for agencies.
2. The manager clicks "Renovar." The system creates a Mercado Pago preference (with success/failure/pending return URLs), a `payment` record, a `payment_mercado_pago` record in PENDING status, and a `subscription_payment` linking them — all in a transaction.
3. The user is redirected to Mercado Pago's checkout.
4. After payment, Mercado Pago hits the webhook endpoint. The handler validates the HMAC signature, fetches payment details from the Mercado Pago API, updates the payment status, and — if the payment is approved and linked to a subscription — publishes an `extend_subscription` event to the broker.
5. The broker consumer processes the event: it looks up the organization through the payment chain, checks a `processed_at` guard to prevent double-extension, and in a transaction updates all subscription rows for the organization (`starts_at = ends_at, ends_at = ends_at + 1 month`), then marks the payment as processed.

The entire extension happens asynchronously. The webhook returns 200 immediately; the actual subscription change happens in the consumer with retry logic and dead letter queue safety.

### Trial limitations

During the free trial, agency organizations are limited to 1 manager beyond the realtor. The invite action checks if any `subscription_payment` records exist for the organization — if none (meaning no payment has ever been made), and the member count is already at 2, the invitation is rejected with "Durante el período de prueba solo podés tener 1 administrador." After the first payment, this restriction lifts and the seat count is recalculated at each renewal.

---

## Event-driven operations

The platform uses a Redpanda message broker (Kafka-compatible, lower resource footprint than Kafka itself) to decouple time-sensitive operations from user requests. Six topics exist, each with a corresponding dead letter queue:

### Email delivery topics

These follow a pattern where the **producer composes the full email** (subject, body, recipients, attachments) and the **consumer merely delivers it**. This means every message is fully inspectable in the Redpanda console, and the consumer has zero business logic.

- **`send_booking_confirmation`** — triggered when a tenant books a visit slot. The producer composes two emails (one for the tenant, one for the manager) with ICS calendar attachments containing the visit date, time, and property address. Keyed by slot ID for idempotency.
- **`send_signing_request`** — triggered when a manager sends a contract for digital signing. The producer composes HTML emails with signing links for each party (landlord and tenant). Keyed by contract ID.
- **`send_landlord_invite`** — triggered when a manager invites a landlord to a property. The producer composes an HTML email with a tokenized invitation link (valid for 7 days). Keyed by `property_id:invitation_token_id`.

All email consumers use a shared `deliver_email()` abstraction that wraps retry/DLQ logic. The actual sending calls a Go SMTP service at `/send-email` — a pure relay with no business logic.

### Business logic topics

- **`extend_subscription`** — triggered by the Mercado Pago webhook when a payment is approved. The consumer extends all subscription rows for the organization by one month. Keyed by `subscription_payment_id`.
- **`calculate_escalation`** — triggered by a minutely cron job when contracts are due for rent adjustment. The consumer runs the escalation calculation against current rate values. Keyed by today's date (so it runs at most once per day even if the cron fires multiple times).
- **`send_renewal_reminder`** — triggered by a daily cron at 8 AM for subscriptions expiring within 7 days or already in grace. The consumer queries affected organizations, calculates amounts, and sends reminder emails to admins. Keyed by today's date.

### Reliability guarantees

Every message carries a deterministic `message-id` header derived from business context (not random UUIDs). Before processing, the consumer checks a Valkey lock (`lock:{topic}:{message_id}`) — if set, the message is skipped. After successful processing, the lock is set with a 24-hour TTL. This guarantees exactly-once processing even under Kafka's at-least-once delivery semantics.

Failed messages are retried up to 3 times (with incremented retry headers). After 3 failures, they're routed to the dead letter queue (`{topic}.dlq`) with a failure reason header. DLQ messages are inspectable in the Redpanda console and can be manually replayed.

---

## Files, encryption, and access control

### File storage model

All files (photos, documents, PDFs, receipts) are stored in the `file` table with encrypted content. Each file has a SHA-256 content hash used for deduplication — uploading the same file twice doesn't create a duplicate row. Files are linked to their contexts through junction tables:

- `user_file` — personal documents (credit report). Linked to user, typed by USER_FILE_TYPE.
- `property_file` — property photos. Linked to property, typed by PROPERTY_FILE_TYPE.
- `contract_file` — contract documents (draft PDF, insurance, signed PDF). Linked to contract, typed by CONTRACT_FILE_TYPE.
- `contract_item_file` — files attached to individual contract items. Linked to contract item.
- `receipt` — payment receipts. Linked to contract, typed by RECEIPT_TYPE (rent, ABL, water, light, gas).

### File serving

A single endpoint (`/files/[file_id]`) serves all files. It resolves access by checking a UNION of all five junction tables to find which property the file belongs to, then verifies the requesting user has view access to that property. User files (personal documents) are a special case — they have no property, so the check is simply "does this file belong to you?"

Files are cached in Valkey (Redis-compatible) with key `file:{id}` to avoid decrypting from the database on every request. There's also a special bypass for the image optimization proxy (imgproxy), which authenticates with a secret key instead of a user session.

### Encryption

Two distinct encryption scopes:

- **PII encryption** — user names, surnames, phone numbers, document numbers, and CUIL numbers are encrypted at rest in the `user` table using AES-256-GCM. Decryption happens once per request in `hooks.server.ts`, populating `locals.user` with cleartext values. This means server-side code always works with decrypted data, but the database never stores cleartext PII.
- **File encryption** — file content is encrypted before storage using AES-256-GCM. The encrypted blob format is `[IV (12 bytes) | encrypted content | auth tag (16 bytes)]`. Decryption happens on file serve (or cache miss).

---

## Rate indexes and rent escalation

Rental contracts in Argentina are legally subject to periodic price adjustments based on official rate indexes. This is not optional — it's how the market works.

The platform maintains a `rate` table with rate values indexed by type, month, and year. Eight rate types are tracked: IPC, ICL, Casa Propia, CAC, CER, IS, IPIM, and UVA. A webmaster-only page allows updating rate values monthly — if a rate for a given type/month/year doesn't exist, it's created; if it exists, it's updated.

Each contract specifies an escalation type (IPC or ICL) and an escalation duration (how frequently adjustments occur). The escalation formulas compare current month values to values from four months prior:
- **IPC**: `price × (IPC_current / IPC_four_months_ago)`
- **ICL**: `price × (ICL_current / ICL_four_months_ago)`

A cron job runs every minute, checking if any active contracts are due for escalation. When they are, it publishes a `calculate_escalation` event. The consumer runs the calculation, creating new pricing periods with updated amounts. The date-based idempotency key ensures this runs at most once per day.

This creates a feedback loop: webmaster updates rates → cron detects due contracts → consumer calculates new prices → tenant sees updated rent in their contract view. The manager doesn't need to manually adjust prices — the system does it based on official indexes.

---

## The landlord's path through the system

Landlords have a distinct journey that's worth tracing separately, because it intersects with the manager's and tenant's flows at specific points:

1. **Invitation** — A manager enters the landlord's email in the property edit page. The system generates a random token, hashes it, stores it in `invitation_token` with a 7-day expiry, and publishes a `send_landlord_invite` event. The email contains a link to `/properties/{property_id}/accept-invite?token={token}`.

2. **Acceptance** — The landlord clicks the link. The system verifies: the token exists, isn't expired, hasn't been used, and the logged-in user's email matches the invitation email. If everything checks out, the landlord is granted LANDLORD access to the property, the token is marked as used, and they're redirected to the property detail page.

3. **Digital certificate onboarding** — When the manager wants to send a contract for signing, they first check if the landlord has a digital certificate. If not, the manager initiates onboarding, which redirects the landlord to Alpha2000's identity verification flow. The result (success/error/rejection) comes back through the onboarding webhook.

4. **Contract signing** — The landlord receives an email with a signing link, signs via Alpha2000's interface, and is redirected back to the platform's signing webhook. Their signature status updates from PENDING to SIGNED.

5. **Signatures page** — The landlord can view all contracts requiring their signature from the `/signatures` page, which aggregates digital signature status across all contracts where they have LANDLORD access.

The landlord never touches the admin panel. Their interaction with the platform is mediated entirely through email links, the signature provider's interface, and the signatures page.

---

## Geographic system and property discovery

The geographic system is more than just storing addresses — it powers the property discovery experience:

### Address search

When a manager creates or edits a property's location, they type an address into a search field. The frontend calls the `/nominatim/search` endpoint, which proxies to Nominatim (OpenStreetMap's geocoding service) with timeout protection and response size limits. The results include structured address components (road, house number, suburb, city, state) and coordinates.

### Zone matching

The `zone` table stores geographic boundaries as PostGIS geometries, each with a name, label, badge, and admin level. When a tenant filters by zone on the property listing, the query uses `ST_Contains(zone.geometry, location.point)` to find properties whose geocoded point falls within the zone's boundary.

This creates a chain: Nominatim search → location record with PostGIS point → zone spatial query → filtered property listing. The same location data appears in property cards, detail pages, candidate notifications, and contract documents.

---

## The help center and self-service

The `/learn` section provides help articles that are referenced from specific points in the platform:

- **Profile information** — explains why personal data is collected, what it's used for (contract signing), and that everything is encrypted. Linked from the profile page.
- **Phone number format** — explains the Argentine E.164 format (+54 country code, 9 for mobile, 10-digit number). Linked from the profile page's phone field.
- **Booking requirements** — explains that a credit report must be uploaded before booking a visit, and what a credit report is. Linked from the property detail page when the "Book" button is disabled.

Articles are stored as Markdown files with frontmatter (slug and title), loaded via `import.meta.glob`, and rendered as HTML. The learn section has a sidebar listing all available articles, serving as a lightweight help center.

These aren't decorative — they're load-bearing. The credit report requirement for booking means a tenant who doesn't understand what's needed would be stuck. The phone format requirement for Argentine numbers means international users need guidance. The articles bridge knowledge gaps at the exact points where they arise.

---

## The chat assistant

The platform includes a conversational AI assistant at `/chat`, accessible without login. It works as a smart guide to the entire platform:

- **Knowledge base** — dynamically loaded at runtime by concatenating every route's `docs/description.md` file. No vector database, no embeddings — just the full documentation injected as system context. Webmaster-only routes (rate management, test payments) are excluded from the knowledge base.
- **Model** — OpenAI GPT-4o-mini with 1024 max tokens, streamed via server-sent events.
- **Language** — responds in the user's language (Spanish or English). Uses "funcionalidades" instead of "funciones" in Spanish to avoid confusion with programming functions.
- **Scope** — answers only what's asked, doesn't elaborate unsolicited, and offers 2-3 follow-up questions to guide conversation. It's instructed to mention AES-256-GCM encryption when users ask about file or data security.

The chat assistant is the only part of the system where all the route descriptions come together as a unified knowledge base. It can explain cross-cutting concerns (how booking connects to candidates, how signing activates contracts) because it has access to every page's description simultaneously.

---

## Notifications

The notification system currently handles one event type: property visit bookings. When a tenant reserves a slot, a notification record is created linking to the candidates page for that property.

Notifications are fetched in the root layout server loader, scoped to the manager's accessible properties (at most 20, ordered by recency). They appear in the global navigation bar, visible across all admin pages. Each notification includes the property's location (road and house number) for quick identification.

Notifications are separate from email events — a booking creates both a persistent in-app notification (for the next time the manager opens the admin panel) and a transient email (delivered immediately through the broker). This dual-channel approach ensures the manager is notified regardless of whether they're currently logged in.

---

## Webmaster tools

Two pages are restricted to platform administrators (webmasters) and serve internal operational needs:

- **Rate index management** (`/rates`) — where rate values are entered monthly. The page shows current month rates by type, allows updating existing values or creating new ones. These rates feed directly into the rent escalation calculations.
- **Test payment** (`/pay`) — a minimal page for verifying the Mercado Pago integration with a $50 ARS test transaction. Used during development and deployment validation.
- **Health check** (`/health`) — returns "ok" for monitoring systems. Not a page — just an endpoint.

---

## What ties it all together

The system's coherence comes from design choices that cut across every feature:

- **The property is always the anchor.** Contracts, candidates, receipts, notifications, access control, files, slots, services — everything references back to a property ID. This makes authorization straightforward (scope queries to accessible property IDs), keeps the data model navigable (you can always trace any entity back to a property), and ensures that deleting or restricting access to a property cascades meaningfully through the entire system.

- **Access control is never implicit.** Every query is scoped to `get_accessible_property_ids()`, every mutation is gated by `require_edit_access()` or `require_view_access()`, and the two-layer model (role permissions + property assignment) prevents both horizontal escalation (accessing another organization's data) and vertical escalation (a tenant performing manager actions). The empty-array guard ensures that users with no property access get empty results rather than SQL errors.

- **Side effects are asynchronous and idempotent.** Emails, subscription extensions, escalation calculations, and renewal reminders all flow through the Redpanda broker. User-facing requests stay fast (publish and return), background work gets retry logic and dead letter queues, and deterministic message IDs with Valkey locks guarantee exactly-once processing. The producer-composes/consumer-delivers pattern for emails keeps context at the source and makes every message inspectable.

- **State is computed, not stored, where possible.** Subscription status is derived from `ends_at` dates at read time, not from a column that needs a cron to flip. This eliminates race conditions between clock time and database state. The same principle applies to candidate status (derived from slot state) and rent amounts (derived from the latest period by start date).

- **Encryption is pervasive and late-decrypting.** PII is encrypted at rest and decrypted once per request in server hooks. Files are encrypted at rest and decrypted on serve (with Valkey caching). The signed contract PDF that comes back from Alpha2000 is encrypted before storage. At no point does cleartext sensitive data sit in the database.

- **The Argentine market shapes the architecture.** Digital signatures through Alpha2000 Firmador (not DocuSign or generic e-signature), rent escalation via IPC/ICL rate indexes (legally mandated), CUIL as a core identity field, Mercado Pago as the payment processor, Argentine phone number formatting (E.164 with +549), and Spanish as the primary language. These aren't localizations applied to a generic product — they're structural decisions that affect the data model, the integrations, and the user flows.

Habita is an operational tool for the people who manage rentals in Argentina. Every feature — from the property tag categories to the warranty types to the rate indexes — exists because the Argentine rental market requires it.
