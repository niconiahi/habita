# Manager: Publish a property

## The Lens

**Actor:** Property manager.

**Goal:** Make a property visible to tenants on the public listing so they can discover and book visits.

**Scenario:** The manager has finished configuring a property (location, rooms, services, photos, tags) and is ready to make it public.

---

## The Experience

### Phase 1: Review and Publish

**Routes:** `/admin/properties`

**Actions:**
- Goes to the properties list
- Sees the property in "Editing" state
- Clicks "Publish"
- Property state changes to "Published"
- The property now appears in the public listing at `/properties`

**Thoughts:**
- "Is everything filled in?"
- "What if I missed something?"
- "Can I unpublish later?"

**Emotions:** Anticipation → Excited (property is live!)

---

## The Output

### Pain Points
- No preview of how the property will look to tenants before publishing
- No completeness check — can publish with missing rooms, photos, or services
- Publish action is on the list page, not the edit page

### Opportunities
- Add a "preview as tenant" mode
- Add a completeness indicator before publishing
- Allow publishing from the edit page
