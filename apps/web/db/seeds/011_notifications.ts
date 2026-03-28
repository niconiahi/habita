/**
 * Notifications seed
 *
 * Creates sample notifications for seeded properties so they
 * appear in the notifications dropdown for the real user.
 */

import { subDays, subHours } from "date-fns"
import type { Kysely } from "kysely"
import { NOTIFICATION_TYPE } from "../../src/lib/notification_type"
import type { DB } from "../types"

export async function seed(_db: Kysely<DB>): Promise<void> {
  console.log("seeding notifications")
  const { query_builder } = await import("../query_builder")
  const properties = await query_builder
    .selectFrom("property")
    .select("id")
    .execute()
  if (properties.length === 0) {
    console.log(
      "no properties found - skipping notifications",
    )
    return
  }
  const now = new Date()
  const notifications = [
    {
      property_id: properties[0].id,
      created_at: subHours(now, 2),
    },
    {
      property_id: properties[1 % properties.length].id,
      created_at: subDays(now, 1),
    },
    {
      property_id: properties[2 % properties.length].id,
      created_at: subDays(now, 3),
    },
  ]
  await query_builder
    .insertInto("notification")
    .values(
      notifications.map((n) => ({
        type: NOTIFICATION_TYPE.PROPERTY_VISIT,
        href: "/admin/candidates",
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
