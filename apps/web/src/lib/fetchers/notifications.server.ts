import { jsonObjectFrom } from "kysely/helpers/postgres"
import { query_builder } from "db/query_builder"

export function fetch_notifications(
  property_ids: number[],
) {
  return query_builder
    .selectFrom("notification")
    .innerJoin(
      "property",
      "property.id",
      "notification.property_id",
    )
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .where("notification.property_id", "in", property_ids)
    .select((eb) => [
      "notification.id",
      "notification.type",
      "notification.href",
      "notification.property_id",
      "notification.created_at",
      jsonObjectFrom(
        eb
          .selectFrom("location")
          .select([
            "location.road",
            "location.house_number",
          ])
          .whereRef(
            "location.id",
            "=",
            "property.location_id",
          ),
      )
        .$notNull()
        .as("location"),
    ])
    .orderBy("notification.created_at", "desc")
    .limit(20)
    .execute()
}

export type Notification = NonNullable<
  Awaited<ReturnType<typeof fetch_notifications>>[0]
>
