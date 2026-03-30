# Manager: View all tenants

## The Lens

**Actor:** Property manager.

**Goal:** See all current tenants across all managed properties.

**Scenario:** The manager wants a quick overview of who's renting their properties.

---

## The Experience

### Phase 1: View Tenants List

**Routes:** `/admin/tenants`

**Actions:**

- Opens the tenants section in the admin dashboard
- Sees all tenants with name, email, and associated property
- Clicks on a tenant to view their full profile

**Thoughts:**

- "Who's renting what?"
- "Is everyone's information up to date?"

**Emotions:** Overview → Informed

---

### Phase 2: View Tenant Detail

**Routes:** `/admin/tenants/[tenant_id]`

**Actions:**

- Views the tenant's full profile
- Reviews personal information and documents

**Thoughts:**

- "Is this tenant's documentation complete?"

**Emotions:** Reviewing → Satisfied

---

## The Output

### Pain Points

- No way to contact tenants from the platform
- No tenant payment history visible from the manager side
- Read-only — no management actions available

### Opportunities

- Add in-app messaging or contact shortcuts
- Show payment receipt history per tenant
