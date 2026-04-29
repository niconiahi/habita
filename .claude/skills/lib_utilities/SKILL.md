---
name: lib_utilities
description: Index of all utility functions in /lib/. Use always before creating new utilities — check here first to avoid duplication.
---

**This file acts as a C-style header file for `apps/web/src/lib/`.** It declares the public interface (signatures, types, constants) without implementation, so consumers know what's available without reading the source files. Just like in C: if you change the implementation, you update the header.

**Whenever you add, remove, or change any export in `apps/web/src/lib/`, you MUST update this file to reflect the change.** This includes new files, renamed functions, changed signatures, added/removed constants, schemas, or types.

# Lib Utilities

All paths relative to `apps/web/src/lib/`

## compose_types.ts

Merges multiple type objects into a single indexed object. Used by domain type files that extend another (e.g., `receipt_type` extends `service`).

- `ObjectValues<T>` — type helper to extract values from a const object
- `compose_types<T extends Record<string, number>[]>(...types: T): Record<string, number>` — merges multiple const objects, re-indexing values sequentially

## compose_action.ts

Formats a SvelteKit action string. Use when building form action URLs.

- `compose_action(action: string): string` — returns `?/${action}`

## safe_async.ts

Wraps a promise into a Go-style error tuple. Use for non-throwing async error handling.

- `safe_async<T>(promise: Promise<T>): Promise<[null, T] | [Error, null]>`

## safe_sync.ts

Wraps a synchronous function into a Go-style error tuple. Use for non-throwing sync error handling.

- `safe_sync<T>(fn: () => T): [null, T] | [Error, null]`

## has_action_error.ts

Type guard for checking form action errors in templates.

- `ActionError` — interface `{ message: string }`
- `has_action_error<K extends string>(form: any, key: K): boolean` — checks if form has error for given action key

## date.ts

Date parsing, formatting, and extraction helpers. Uses `es-AR` locale.

- `DateSchema` — Valibot schema that transforms empty strings to `undefined`
- `format_date_for_input(date: string | Date): string` — formats for `<input type="datetime-local">`
- `get_date(date: Date): string` — extracts `YYYY-MM-DD`
- `get_time(date: Date): string` — extracts time portion
- `get_day(date: Date | string): number` — day of month
- `get_month(date: Date | string, as?: "number"): number` — month as 1-12
- `get_month(date: Date | string, as: "word"): string` — month as uppercase Spanish word
- `get_year(date: Date | string): number` — full year

## display_date.ts

Formats dates for user-facing display in Spanish.

- `display_date(date: Date | string, options?: { time?: boolean }): string` — Spanish format, Buenos Aires timezone

## display_name.ts

Formats user name for display.

- `display_name(user: { name: string; surname: string }): string` — returns `"name surname"`

## display_location.ts

Formats property location for display.

- `display_location(location: { road: string; house_number: number }): string` — returns `"road house_number"`

## duration.ts

ISO 8601 duration constants and helpers.

- `Duration` — type for valid duration strings
- `DURATIONS` — array of valid durations: `P1D`, `P1W`, `P3M`, `P6M`, `P1Y`
- `DurationSchema` — Valibot picklist schema
- `get_duration_label(duration: Duration): string` — Spanish label (e.g., "1 mes")
- `get_duration_time(duration: Duration): number` — milliseconds value

## force_number.ts

Coerces string/undefined inputs to numbers with validation.

- `ForceNumberSchema` — Valibot schema: `string | undefined | number` -> `number`

## location.ts

Validation schema for location data from Nominatim.

- `Location` — type with place_id, lat, lon, display_name, address
- `LocationSchema` — Valibot object schema for location validation

## auth-client.ts

BetterAuth client instance for client-side auth operations.

- `authClient` — configured BetterAuth client with organization and inferAdditionalFields plugins

---

# Domain Type Files

All follow the same pattern: `CONST` object + `Schema` + `Type` + `get_*_label()` + `get_*()` (returns all values).

## access_type.ts

Property access levels.

- `ACCESS_TYPE` — `{ LANDLORD: 0, MANAGER: 1, TENANT: 2 }`
- `AccessTypeSchema` — Valibot picklist
- `AccessType` — type
- `get_access_label(type: number | AccessType): string`
- `get_access_types(): AccessType[]`

## contract_file_type.ts

Types of files attached to contracts.

- `CONTRACT_FILE_TYPE` — `{ CONTRACT: 0, INSURANCE: 1, SIGNED: 2 }`
- `ContractFileTypeSchema` — Valibot picklist
- `ContractFileType` — type
- `get_contract_file_type_label(type: number | ContractFileType): string`
- `get_contract_file_types(): ContractFileType[]`

## contract_item_state.ts

State of items inventoried in a contract.

- `CONTRACT_ITEM_STATE` — `{ GOOD: 0, DEFECTIVE: 1 }`
- `ContractItemStateSchema` — Valibot picklist
- `ContractItemState` — type
- `get_contract_item_state_label(type: number | ContractItemState): string` — "Bueno" | "Defectuoso"
- `get_contract_item_states(): ContractItemState[]`

## contract_state.ts

Lifecycle state of a contract.

- `CONTRACT_STATE` — `{ EDITING: 0, ACTIVE: 1, FINISHED: 2 }`
- `ContractStateSchema` — Valibot picklist
- `ContractState` — type
- `get_contract_state_label(type: number | ContractState): string` — "En edicion" | "Activo" | "Finalizado"
- `get_contract_states(): ContractState[]`

## contract_type.ts

Duration type of a rental contract.

- `CONTRACT_TYPE` — `{ SHORT_TERM: 0, LONG_TERM: 1 }`
- `ContractTypeSchema` — Valibot picklist
- `ContractType` — type
- `get_contract_type_label(type: number | ContractType): string`
- `get_contract_types(): ContractType[]`

## court.ts

Jurisdictional courts.

- `COURT` — `{ CIUDAD_DE_BUENOS_AIRES: 0, LOMAS_DE_ZAMORA: 1 }`
- `CourtSchema` — Valibot picklist
- `Court` — type
- `get_court_label(type: number | Court): string`
- `get_courts(): Court[]`

## default_type.ts

Default/penalty calculation type on contracts.

- `DEFAULT_TYPE` — `{ FIXED: 0, PORCENTUAL: 1 }`
- `DefaultTypeSchema` — Valibot picklist
- `DefaultType` — type
- `get_default_label(type: number | DefaultType): string`
- `get_default_types(): DefaultType[]`

## escalation_type.ts

Rent escalation index type.

- `ESCALATION_TYPE` — `{ IPC: 0, ICL: 1 }`
- `EscalationTypeSchema` — Valibot picklist
- `EscalationType` — type
- `get_escalation_formula(type: number | EscalationType): string` — formula description
- `get_escalation_label(type: number | EscalationType): string`
- `get_escalation_types(): EscalationType[]`

## expense_type.ts

Types of property expenses.

- `EXPENSE_TYPE` — `{ EXTRAORDINARY: 0, ORDINARY: 1 }`
- `ExpenseTypeSchema` — Valibot picklist
- `ExpenseType` — type
- `get_expense_types(): ExpenseType[]`

## fine_type.ts

Fine calculation types on contracts.

- `FINE_TYPE` — `{ FIXED: 0, PORCENTUAL: 1 }`
- `FineTypeSchema` — Valibot picklist
- `FineType` — type
- `get_fine_formula(type: number | FineType): string` — formula description
- `get_fine_label(type: number | FineType): string` — "Fijo" | "Porcentual"
- `get_fine_types(): FineType[]`

## floor_number.ts

Building floor number constants and display.

- `FLOOR_NUMBER` — `{ SECOND_BASEMENT: -2, ..., FIFTH: 5 }`
- `FloorNumberSchema` — Valibot picklist
- `FloorNumber` — type
- `display_floor_number(number: number | FloorNumber): string` — Spanish label
- `get_floor_numbers(): FloorNumber[]`

## notification_type.ts

Types of notifications.

- `NOTIFICATION_TYPE` — `{ PROPERTY_VISIT: 0, NO_AVAILABLE_SLOTS: 1 }`
- `NotificationTypeSchema` — Valibot picklist
- `NotificationType` — type
- `get_notification_type_label(type: number | NotificationType): string`
- `compose_property_visit_href(property_id: number): string`
- `compose_no_available_slots_href(property_id: number): string`
- `get_notification_types(): NotificationType[]`

## organization_role.ts

Roles within an organization.

- `ORGANIZATION_ROLE` — `{ LANDLORD: "landlord", REALTOR: "realtor", MANAGER: "manager", TENANT: "tenant" }`
- `OrganizationRoleSchema` — Valibot picklist
- `OrganizationRole` — type
- `get_role_label(role: OrganizationRole): string`

## payment_status.ts

MercadoPago payment status tracking.

- `PAYMENT_STATUS` — `{ PENDING: 0, APPROVED: 1, REJECTED: 2, CANCELLED: 3, REFUNDED: 4, CHARGED_BACK: 5 }`
- `PaymentStatusSchema` — Valibot picklist
- `PaymentStatus` — type
- `get_payment_status_label(type: number | PaymentStatus): string`
- `get_payment_status_style(type: number | PaymentStatus): string` — CSS class name
- `get_payment_statuses(): PaymentStatus[]`

## property_destiny.ts

Intended use of a property.

- `PROPERTY_DESTINY` — `{ RESIDENTIAL: 0, COMMERCIAL: 1 }`
- `PropertyDestinySchema` — Valibot picklist
- `PropertyDestiny` — type
- `get_property_destiny_label(type: number | PropertyDestiny): string`
- `get_property_destinies(): PropertyDestiny[]`

## property_state.ts

Lifecycle state of a property listing.

- `PROPERTY_STATE` — `{ EDITING: 0, PUBLISHED: 1, RENTED: 2 }`
- `PropertyStateSchema` — Valibot picklist
- `PropertyState` — type
- `get_property_state_label(type: number | PropertyState): string`
- `get_property_states(): PropertyState[]`

## property_tag_type.ts

Tags for property features/amenities.

- `PROPERTY_TAG_TYPE` — 21 tags (CONTRAFRENTE through APTO_PERRO)
- `PROPERTY_TAG_CATEGORIES` — array of `PropertyTagCategory` grouping tags into 7 categories
- `PropertyTagTypeSchema` — Valibot picklist
- `PropertyTagType` — type
- `PropertyTagCategory` — interface `{ label: string; tags: PropertyTagType[] }`
- `get_property_tag_type_label(type: number | PropertyTagType): string`
- `get_property_tag_slug(type: number | PropertyTagType): string` — URL-safe slug
- `get_property_tag_type_from_slug(slug: string): PropertyTagType` — reverse lookup
- `get_property_tag_types(): PropertyTagType[]`

## property_type.ts

Type of property (building vs house).

- `PROPERTY_TYPE` — `{ DEPARTMENT: 0, HOUSE: 1 }`
- `PropertyTypeSchema` — Valibot picklist
- `PropertyType` — type
- `get_property_type_label(type: number | PropertyType): string` — "Departamento" | "Casa"
- `get_property_types(): PropertyType[]`

## rate_type.ts

Economic rate/index types for rent escalation.

- `RATE_TYPE` — `{ IPC: 0, ICL: 1, CASA_PROPIA: 2, CAC: 3, CER: 4, IS: 5, IPIM: 6, UVA: 7 }`
- `RateTypeSchema` — Valibot picklist
- `RateType` — type
- `get_rate_label(type: number | RateType): string`
- `get_rate_type_label(type: RateType): string`
- `get_rate_types(): RateType[]`

## receipt_type.ts

Types of receipts (extends service types with RENT).

- `RECEIPT_TYPE` — composed from `SERVICE_TYPE` + `{ RENT: 0 }` via `compose_types`
- `ReceiptTypeSchema` — Valibot picklist
- `ReceiptType` — type
- `get_receipt_type_label(type: ReceiptType): string`
- `get_receipt_types(): ReceiptType[]`

## room_type.ts

Types of rooms in a property.

- `ROOM_TYPE` — `{ BEDROOM: 0, BATHROOM: 1, KITCHEN: 2, LIVING_ROOM: 3, DINING_ROOM: 4 }`
- `RoomTypeSchema` — Valibot picklist
- `RoomType` — type
- `display_room_type(type: number | RoomType): string`
- `get_room_types(): RoomType[]`

## service.ts

Utility service types for a property.

- `SERVICE_TYPE` — `{ MUNICIPAL_FEE: 0, WATER: 1, LIGHT: 2, GAS: 3 }`
- `ServiceTypeSchema` — Valibot picklist
- `ServiceType` — type
- `get_service_type_label(type: number | ServiceType): string`
- `get_service_types(): ServiceType[]`

## signature_status.ts

Digital signature workflow status.

- `SIGNATURE_STATUS` — `{ PENDING: "pending", SIGNED: "signed", ERROR: "error", REJECTED: "rejected" }`
- `SignatureStatusSchema` — Valibot picklist
- `SignatureStatus` — type
- `get_signature_status_label(status: SignatureStatus): string`

## slot_state.ts

State of a property visit slot.

- `SLOT_STATE` — `{ FREE: 0, RESERVED: 1, CANCELLED: 2 }`
- `SlotStateSchema` — Valibot picklist
- `SlotState` — type
- `get_slot_state_label(type: number | SlotState): string` — "Libre" | "Reservado" | "Cancelado"
- `get_slot_states(): SlotState[]`

## subscription_status.ts

Subscription lifecycle status.

- `SUBSCRIPTION_STATUS` — `{ ACTIVE: 0, GRACE: 1, LOCKED: 2 }`
- `SubscriptionStatusSchema` — Valibot picklist
- `SubscriptionStatus` — type
- `get_subscription_status_label(type: number | SubscriptionStatus): string`
- `get_subscription_statuses(): SubscriptionStatus[]`

## subscription_type.ts

Types of subscription plans.

- `SUBSCRIPTION_TYPE` — `{ FREELANCE: 0, REALTOR: 1 }`
- `SubscriptionTypeSchema` — Valibot picklist
- `SubscriptionType` — type
- `get_subscription_type_label(type: number | SubscriptionType): string`
- `get_subscription_types(): SubscriptionType[]`

## user_file_type.ts

Types of files attached to users.

- `USER_FILE_TYPE` — `{ CREDIT_REPORT: 0 }`
- `UserFileTypeSchema` — Valibot picklist
- `UserFileType` — type
- `get_user_file_type_label(type: number | UserFileType): string`
- `get_user_file_types(): UserFileType[]`

## warranty_type.ts

Types of rental warranties.

- `WARRANTY_TYPE` — `{ PROPERTY: "property", INCOME: "income", SURETY: "surety" }`
- `WarrantyTypeSchema` — Valibot picklist
- `WarrantyType` — type
- `get_warranty_type_label(type: WarrantyType): string`
- `get_warranty_types(): WarrantyType[]`

---

# Server Utilities

All paths relative to `apps/web/src/lib/server/`

## auth.ts

BetterAuth server instance (HMR-safe singleton via globalThis).

- `auth` — betterAuth instance with organization plugin, email+password, session management

## error.ts

Creates error responses for loaders.

- `error(status: number, message: string | Record<string, unknown>, init?: ResponseInit): Response`

## form.ts

Normalizes FormData into a plain object for Valibot validation.

- `normalize_input<T extends v.ObjectSchema>(formData: FormData, schema: T): Record<string, unknown>`

## now.ts

Current timestamp constant.

- `now` — ISO 8601 string of current time

## origin.ts

Application origin URL.

- `get_origin(): string` — returns `ORIGIN` env var

## token.ts

Token generation and hashing for secure links.

- `make_token(): string` — generates random hex token
- `compose_token_hash(token: string): string` — SHA-256 hash of token

## encryption.ts

AES-256-GCM encryption/decryption.

- `encrypt(plaintext: string): string` — encrypts with `ENCRYPTION_KEY`
- `decrypt(ciphertext: string): string` — decrypts with `ENCRYPTION_KEY`

## is_webmaster.ts

Checks if user is a webmaster.

- `is_webmaster(user: { email: string }): boolean`

## pluralize.ts

Simple Spanish pluralization.

- `pluralize(word: string, count: number): string`

## point.ts

PostGIS point composition.

- `compose_point(latitude: number, longitude: number): SQL` — returns SQL expression for `ST_SetSRID(ST_MakePoint(...))`

## ics.ts

iCalendar file generation helpers.

- `escape_ics_text(text: string): string` — escapes special characters
- `format_ics_date(date: Date): string` — formats to `YYYYMMDDTHHmmssZ`

## force_date.ts

Coerces string inputs to Date objects.

- `ForceDateSchema` — Valibot schema: `string` -> `Date`

## kv.ts

Redis key-value store client.

- `kv.get(key: string): Promise<string | null>`
- `kv.set(key: string, value: string, seconds?: number): Promise<string>`
- `kv.del(key: string): Promise<number>`
- `kv.incr(key: string): Promise<number>`
- `kv.expire(key: string, seconds: number): Promise<number>`

## rate_limit.ts

Request rate limiting per route.

- `WINDOW_SECONDS` — 60
- `DEFAULT_MAX_REQUESTS` — 60
- `ROUTE_LIMITS` — array of per-route limits
- `is_rate_limited(event: RequestEvent): Promise<boolean>`

## image.ts

Image URL composition for object store files.

- `ImageOptions` — interface for width/height/format
- `GetImgPropsOptions` — interface extending ImageOptions with alt
- `get_img_props(file_id: number, hash: string, options: GetImgPropsOptions): { src: string; alt: string; ... }`

## notification_emitter.ts

Server-sent events for notifications.

- `notification_emitter` — EventEmitter instance
- `NOTIFICATION_EVENT` — event name constant

## organization.ts

Organization queries and role checks.

- `OrganizationRole` — type: `"landlord" | "realtor" | "manager" | "tenant"`
- `SelectableOrganization` — type inferred from query
- `get_user_realtor_organization(user_id: number)`
- `get_user_organization(user_id: number)`
- `is_realtor(user_id: number): Promise<boolean>`
- `get_user_selectable_organizations(user_id: number)`
- `get_organization_managers(organization_id: string)`

## landlord.ts

Fetches landlord data for a property.

- `fetch_landlord(property_id: number)` — returns landlord user data or null
- `Landlord` — type inferred from fetch result

## manager.ts

Fetches manager data for a property.

- `fetch_manager(property_id: number)` — returns manager user data or null
- `Manager` — type inferred from fetch result

## tenant.ts

Fetches tenant data for a property.

- `fetch_tenant(property_id: number)` — returns tenant user data or null
- `Tenant` — type inferred from fetch result

## subscription.ts

Subscription lifecycle management.

- `GRACE_PERIOD_DAYS` — 7
- `SUBSCRIPTION_CACHE_TTL_SECONDS` — 86400
- `SubscriptionCheck` — union type for subscription status results
- `resolve_subscription_status(ends_at: Date): SubscriptionStatus`
- `get_grace_days_remaining(ends_at: Date): number`
- `fetch_user_subscriptions(user_id: number)`
- `fetch_user_subscriptions_cached(user_id: number)` — Redis-cached version
- `invalidate_user_subscriptions_cache(user_id: number)`
- `fetch_organization_subscriptions(organization_id: string)`
- `require_active_subscription(subscriptions, active_organization_id): SubscriptionCheck`

## property_access.ts

Authorization layer for property access control (ACL).

- `require_property_access(headers, user_id, property_id, allowed_types, active_organization_id, permissions)` — throws if unauthorized
- `require_view_access(...)` — shorthand for landlord+manager+tenant
- `require_edit_access(...)` — shorthand for landlord+manager
- `require_landlord_access(...)` — shorthand for landlord only
- `get_accessible_property_ids(user_id, types?, active_organization_id?): Promise<number[]>`
- `assign_property_access(property_id, user_id, type, granted_by?)`
- `is_tenant_accessible(tenant_id, manager_property_ids): Promise<boolean>`
- `revoke_all_access_by_type(property_id, type)`

## object_store.ts

S3-compatible object storage operations.

- `OBJECT_STORE_ERROR` — `{ NETWORK: 0, NOT_FOUND: 1, UNKNOWN: 2 }`
- `ObjectStoreError` — type
- `put_object(key: string, content: Buffer, mime: string): Promise<[ObjectStoreError, null] | [null, null]>`
- `get_object(key: string): Promise<[ObjectStoreError, null] | [null, Buffer]>`
- `delete_object(key: string): Promise<[ObjectStoreError, null] | [null, null]>`
- `object_exists(key: string): Promise<[ObjectStoreError, null] | [null, boolean]>`

## send_email.ts

Email sending via external API.

- `SEND_EMAIL_ERROR` — error codes
- `SendEmailError` — type
- `send_email(body: object, headers?: Record<string, string>): Promise<[SendEmailTypedError, null] | [null, null]>`

## digital_signature.ts

Digital signature API integration.

- `API_FETCH_ERROR` — error codes
- `ApiFetchError` — type
- `check_certificate(cuil: string)`
- `submit_for_signing(params: SubmitForSigningParams)`
- `fetch_unsigned_document_status(document_id: string)`
- `fetch_signed_document(document_id: string)`
- `verify_signature(params: VerifySignatureParams)`
- `start_registration(email: string)`
- `start_onboarding(params: StartOnboardingParams)`

## mercado_pago_payment.ts

MercadoPago payment preference creation.

- `CREATE_PREFERENCE_ERROR` — error codes
- `CreatePreferenceError` — type
- `MercadoPagoPreferenceSchema` — Valibot schema for API response
- `create_preference(options: CreatePreferenceOptions): Promise<[CreatePreferenceError, null] | [null, { id: string; init_point: string }]>`

## pdf_generator.ts

PDF generation via Playwright.

- `GENERATE_PDF_WITH_PLAYWRIGHT_ERROR` — error codes
- `GeneratePdfWithPlaywrightError` — type
- `generate_pdf_with_playwright(html: string): Promise<[GeneratePdfWithPlaywrightError, null] | [null, Buffer]>`

## upsert_file.ts

File upload and database record management.

- `upsert_file(file: File, db: Kysely<DB> | Transaction<DB>): Promise<number>` — uploads to object store, inserts/updates DB record, returns file ID
- `upsert_file_from_buffer(content: Buffer, basename: string, mime: string, db: Kysely<DB> | Transaction<DB>): Promise<number>`

## calculate_all_due_escalations.ts

Processes pending rent escalations.

- `calculate_all_due_escalations(): Promise<{ processed: number }>`

## telemetry/sdk.ts

Server-side OpenTelemetry initialization. Called in `hooks.server.ts` init hook before any HTTP calls.

- `init_telemetry(): void` — starts NodeSDK with auto-instrumentations (HTTP, pg, ioredis)

## telemetry/sdk.client.ts

Browser-side OpenTelemetry initialization.

- `init_browser_telemetry(): void` — sets up trace/log export to `/api/otel/v1/traces` and `/api/otel/v1/logs`

---

# Observability App (`apps/observability/src/lib/`)

Separate SvelteKit app for viewing telemetry data. Not shared with the main app.

## safe_async.ts

- `safe_async<T>(promise: Promise<T>): Promise<[Error, null] | [null, T]>`

## server/auth.ts

Minimal Better Auth config for session validation only (no login UI, no OAuth).

- `auth` — Proxy-wrapped Better Auth instance (HMR-safe singleton)
- `require_authentication(locals, url): asserts locals` — redirects to main app login if not authenticated

## server/clickhouse.ts

ClickHouse HTTP API client. Queries `http://telemetry-db:8123` with `FORMAT JSON`.

- `escape_clickhouse(value: string): string` — escapes `'` and `\` for SQL string params
- `query_clickhouse<T>(sql: string, schema: GenericSchema<T>): Promise<[Error, null] | [null, T[]]>` — executes SQL, validates response with Valibot schema

## contract/types.ts

Shared types for contract document generation.

- `Fine`, `Default`, `Signatory`, `Location`, `Service`, `Escalation`, `ContractProps` — interfaces

## contract/compose_html.ts

Generates contract HTML for PDF rendering.

- `fetch_contract_data(property_id: number, contract_id: number)`
- `compose_html(contract, property, landlord, tenant, warranty): string`

## contract/validate_contract.ts

Validates contract requirements before signing.

- `ValidationResult` — `{ valid: true } | { valid: false; errors: string[] }`
- `validate_contract_requirements(contract, property, landlord, tenant): ValidationResult`

---

# Broker

All paths relative to `apps/web/src/lib/server/broker/`

## Events

Topic constants and Valibot schemas for Kafka messages. Each file exports a `*_TOPIC` constant and an event schema/type.

- `calculate_escalation.ts` — `CALCULATE_ESCALATION_TOPIC`, `CalculateEscalationEvent`
- `extend_subscription.ts` — `EXTEND_SUBSCRIPTION_TOPIC`, `ExtendSubscriptionEvent`
- `send_renewal_reminder.ts` — `SEND_RENEWAL_REMINDER_TOPIC`, `SendRenewalReminderEvent`
- `send_booking_confirmation.ts` — `SEND_BOOKING_CONFIRMATION_TOPIC`, `SendBookingConfirmationEvent`
- `send_signing_request.ts` — `SEND_SIGNING_REQUEST_TOPIC`, `SendSigningRequestEvent`
- `send_landlord_invite.ts` — `SEND_LANDLORD_INVITE_TOPIC`, `SendLandlordInviteEvent`
- `delete_object.ts` — `DELETE_OBJECT_TOPIC`, `DeleteObjectEvent`
- `send_no_slots_alert.ts` — `SEND_NO_SLOTS_ALERT_TOPIC`, `SendNoSlotsAlertEvent`

## Producers

Publish functions that send messages to Kafka topics.

- `publish_calculate_escalation(): Promise<void>`
- `publish_extend_subscription(subscription_payment_id: number): Promise<void>`
- `publish_send_booking_confirmation(slot_id: number, payload: SendBookingConfirmationEvent): Promise<void>`
- `publish_send_landlord_invite(property_id: number, invitation_token_id: number, payload: SendLandlordInviteEvent): Promise<void>`
- `publish_send_renewal_reminder(): Promise<void>`
- `publish_send_signing_request(contract_id: number, payload: SendSigningRequestEvent): Promise<void>`
- `publish_delete_object(key: string): Promise<void>`
- `publish_send_no_slots_alert(property_id: number, user_id: number, payload: SendNoSlotsAlertEvent): Promise<void>`

## Consumers

Consumers have been extracted to their own independent package at `apps/broker/`. See that package for consumer handlers, retry logic, and infrastructure. Event schemas are duplicated across both packages — keep in sync.

## topic.ts

- `dlq_topic(topic: string): string` — composes dead-letter queue topic name

---

# Cron Jobs

All paths relative to `apps/web/src/lib/server/cron/`

- `create_escalation_jobs(): Promise<{ created: number }>` — creates pending escalation jobs for active contracts
- `create_renewal_jobs(): Promise<{ created: number }>` — creates renewal reminder jobs
- `send_renewal_reminder(): Promise<void>` — sends subscription renewal reminder emails
- `extend_subscription_by_payment_id(subscription_payment_id: number): Promise<void>` — extends subscription after payment

---

# Fetchers

All paths relative to `apps/web/src/lib/fetchers/`

## notifications.server.ts

- `fetch_notifications(property_ids: number[])` — fetches recent notifications with location data
- `Notification` — type inferred from query result

## notifications.schemas.ts

- `PropertyVisitNotificationSchema` — Valibot object schema
- `PropertyVisitNotification` — type
- `NoAvailableSlotsNotificationSchema` — Valibot object schema
- `NoAvailableSlotsNotification` — type
- `NotificationSchema` — Valibot variant schema (discriminated by `type`)
- `NotificationsSchema` — Valibot array schema
- `Notification` — type

## zones.ts

- `fetch_zones()` — fetches all zones

## properties.ts

- `PropertyFilters` — interface for filtering
- `Property` — type inferred from query
- `fetch_properties(filters?: PropertyFilters)` — fetches properties with optional filters

---

# Seeder

Test and seed data helpers. All exported from `apps/web/src/lib/seeder/index.ts`.

- `create_user(data: { name, surname, email, document_number, phone_number, cuil? }): Promise<number>`
- `find_user_by_email(email: string): Promise<number | null>`
- `create_organization(name: string): Promise<string>`
- `add_member(organization_id: string, user_id: number, role: string): Promise<string>`
- `create_location(data: { address, latitude, longitude, road, house_number, ... }): Promise<number>`
- `create_property(data: { location_id, state, type, unit?, destinies }): Promise<number>`
- `update_property_state(property_id: number, state: number): Promise<void>`
- `add_property_file(property_id: number, file_id: number, type: number): Promise<void>`
- `add_property_tag(property_id: number, type: number): Promise<number>`
- `add_floor(property_id: number, data: { number }): Promise<number>`
- `add_room(floor_id: number, data: { type, width, length }): Promise<number>`
- `position_room(room_id: number, data: { position_x, position_y }): Promise<void>`
- `add_service(property_id: number, data: { type, code }): Promise<number>`
- `create_contract(property_id: number, data: { type, state, start_date?, ... }): Promise<number>`
- `add_contract_file(contract_id: number, file_id: number, type: number): Promise<void>`
- `add_contract_item(contract_id: number, data: { name, state }): Promise<number>`
- `add_contract_item_file(contract_item_id: number, file_id: number): Promise<void>`
- `create_period(contract_id: number, data: { price, start_date, end_date }): Promise<number>`
- `create_receipt(contract_id: number, file_id: number, type: number): Promise<number>`
- `create_rate(data: { type, month, year, value }): Promise<number>`
- `create_warranty(type: string): Promise<number>`
- `create_property_warranty(warranty_id: number, location_id: number, data: { ... }): Promise<number>`
- `create_income_warranty(warranty_id: number): Promise<number>`
- `add_income_guarantor(income_warranty_id: number, data: { name, dni, email }): Promise<number>`
- `create_surety_warranty(warranty_id: number, data: { ... }): Promise<number>`
- `create_slot(property_id: number, host_id: number, data: { start_date, end_date, event_id }): Promise<number>`
- `reserve_slot(slot_id: number, visitant_id: number): Promise<void>`
- `set_owner(property_id: number, user_id: number): Promise<void>`
- `set_manager(property_id: number, user_id: number): Promise<void>`
- `set_tenant(property_id: number, user_id: number): Promise<void>`
- `grant_access_by_email(property_id: number, email: string, type: AccessType): Promise<void>`
- `add_user_file(user_id: number, file_id: number, type: number): Promise<void>`
- `upload_file(path: string): Promise<number>` — uploads file to object store, returns file ID
