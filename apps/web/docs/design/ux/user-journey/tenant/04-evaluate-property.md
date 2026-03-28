# Tenant: Evaluate a property

## The Lens

**Actor:** Tenant — a person looking for a place to rent.

**Goal:** Understand whether a specific property meets their needs before deciding to book a visit.

**Scenario:** The tenant clicks on a property from the listing and reviews all available details — location, rooms, layout, and photos.

---

## The Experience

### Phase 1: View Property Details

**Routes:** `/properties/[property_id]`

**Actions:**
- Reads the full address: street, neighborhood, city, province
- Checks the property's intended use (residential, commercial)
- Reviews the room list with types and dimensions
- Explores the visual room map showing the layout
- Browses the photo gallery

**Thoughts:**
- "Is this neighborhood safe?"
- "Are the rooms big enough?"
- "What does the layout look like?"
- "These photos look good / don't show enough"

**Emotions:** Evaluating → Interested (good match) or Moving on (not what they expected)

---

### Phase 2: Decide to Book or Leave

**Routes:** `/properties/[property_id]`

**Actions:**
- If interested, clicks the "Book" button
- If they haven't uploaded a credit report, the button takes them to a help article instead of the booking page
- If not interested, goes back to browsing

**Thoughts:**
- "I want to see this place in person"
- "Wait, I need a credit report? I didn't know that"

**Emotions:** Eager (if ready) → Blocked (if missing credit report)

---

## The Output

### Pain Points
- The "Book" button silently redirects to a learn article if the credit report is missing — the tenant doesn't get a clear error message explaining why they can't book
- Property images are served as inline base64 — may be slow for properties with many photos
- No way to save/favorite a property for later comparison

### Opportunities
- Show a clear message when the credit report is missing ("Upload your credit report to book a visit")
- Add a "save for later" or favorites feature
- Add a map view showing the property's exact location
