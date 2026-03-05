---
name: loaders
description: Data fetching patterns for loaders. Use when writing database queries, creating data fetching functions, or implementing route loaders.
---

- Every block of code that calls the database using `query_builder` will be wrapped in a function with prefix `fetch`

```ts
function fetch_candidates() {
 return query_builder
    .selectFrom("slot")
    .innerJoin("user as visitant", "visitant.id", "slot.visitant_id")
    .innerJoin("property", "property.id", "slot.property_id")
    .innerJoin("location", "location.id", "property.location_id")
    .where("slot.visitant_id", "is not", null)
    .where("slot.state", "=", SLOT_STATE.RESERVED)
    .select([
      "slot.id",
      "slot.start_date",
      "slot.end_date",
      "slot.created_at",
      "visitant.id as visitant_id",
      "visitant.email as visitant_email",
      "visitant.name as visitant_name",
      "visitant.surname as visitant_surname",
      "visitant.phone_number as visitant_phone_number",
      "property.id as property_id",
      "location.road",
      "location.house_number",
      "location.suburb",
      "location.city",
      "location.town",
      "location.state",
    ])
    .orderBy("slot.start_date", "asc")
    .execute()
}
```
