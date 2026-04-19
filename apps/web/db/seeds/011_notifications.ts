/**
 * Notifications seed
 *
 * Creates sample notifications for seeded properties so they
 * appear in the notifications dropdown for the real user.
 */

import { subDays } from "date-fns"
import type { Kysely } from "kysely"
import { compose_property_visit_href, NOTIFICATION_TYPE } from "../../src/lib/notification_type"
import type { DB } from "../types"

export async function seed(_db: Kysely<DB>): Promise<void> {
  console.log("seeding notifications")
  const { query_builder } = await import("../query_builder")
  const properties_with_visits = await query_builder
    .selectFrom("property")
    .innerJoin("slot", "slot.property_id", "property.id")
    .select("property.id")
    .groupBy("property.id")
    .execute()
  if (properties_with_visits.length === 0) {
    console.log(
      "no properties with visits found - skipping notifications",
    )
    return
  }
  const now = new Date()
  const notifications = properties_with_visits.map(
    (p, i) => ({
      property_id: p.id,
      created_at: subDays(now, i),
    }),
  )
  await query_builder
    .insertInto("notification")
    .values(
      notifications.map((n) => ({
        type: NOTIFICATION_TYPE.PROPERTY_VISIT,
        href: compose_property_visit_href(n.property_id),
        property_id: n.property_id,
        created_at: n.created_at,
        updated_at: n.created_at,
      })),
    )
    .execute()
  console.log(
    `created ${notifications.length} notifications`,
  )
}
