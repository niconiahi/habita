# Manager: Configure property rooms

## The Lens

**Actor:** Property manager.

**Goal:** Define the rooms in a property — their types, dimensions, and layout.

**Scenario:** The manager adds rooms to a property listing so tenants can see exactly what spaces are available and how they're arranged.

---

## The Experience

### Phase 1: Add Rooms

**Routes:** `/admin/properties/[property_id]/edit`

**Actions:**
- Clicks to add a new room
- Selects the room type (bedroom, bathroom, kitchen, living room, etc.)
- Enters dimensions (length × width)
- Repeats for each room

**Thoughts:**
- "How many rooms does this property have?"
- "Do I need to add the hallway?"

**Emotions:** Methodical → Thorough

---

### Phase 2: Arrange Room Layout

**Routes:** `/admin/properties/[property_id]/edit`

**Actions:**
- Uses the visual room map to position rooms
- Drags rooms to update their positions
- Saves the layout

**Thoughts:**
- "Does this layout match the actual floor plan?"
- "Can tenants understand this map?"

**Emotions:** Creative → Satisfied (visual layout looks right)

---

### Phase 3: Edit or Remove Rooms

**Routes:** `/admin/properties/[property_id]/edit`

**Actions:**
- Updates a room's type or dimensions if needed
- Removes rooms that were added by mistake

**Thoughts:**
- "I made a mistake on the dimensions"
- "This room shouldn't be listed"

**Emotions:** Corrective → Clean

---

## The Output

### Pain Points
- All room operations happen on the same large edit page
- The room map is a custom component — may not be intuitive without guidance

### Opportunities
- Add room map instructions or tooltips for first-time users
