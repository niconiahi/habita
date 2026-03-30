# Manager: Select a tenant

## The Lens

**Actor:** Property manager.

**Goal:** Promote a candidate to tenant status for a property.

**Scenario:** After reviewing candidates and conducting visits, the manager has decided who should be the tenant. They promote that candidate from the candidates list.

---

## The Experience

### Phase 1: Promote Candidate

**Routes:** `/admin/candidates`

**Actions:**

- Goes to the global candidates list
- Clicks the action to promote the chosen candidate to tenant
- System grants the candidate tenant access to the property

**Thoughts:**

- "Am I making the right choice?"
- "What happens to the other candidates?"
- "Will the tenant be notified?"

**Emotions:** Decisive → Relieved (tenant selected, next step is the contract)

---

## The Output

### Pain Points

- No rejection flow for other candidates
- Unclear if the selected tenant gets notified
- No undo option if the wrong candidate is promoted

### Opportunities

- Notify un-selected candidates that the property is taken
- Send a welcome notification to the selected tenant
- Add a confirmation step before promoting
