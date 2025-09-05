import {
  jsonArrayFrom,
  jsonObjectFrom,
} from "kysely/helpers/postgres"
import { query_builder } from "~/lib/server/query_builder"

export async function fetch_property(id: number) {
  return query_builder
    .selectFrom("property")
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .select((eb) => [
      "property.id",
      jsonArrayFrom(
        eb
          .selectFrom("room")
          .select([
            "room.id",
            "room.type",
            "room.width",
            "room.length",
          ])
          .whereRef("room.property_id", "=", "property.id"),
      ).as("rooms"),
      jsonObjectFrom(
        eb
          .selectFrom("location")
          .select([
            "location.address",
            "location.id",
            "location.latitude",
            "location.longitude",
            "location.road",
            "location.house_number",
            "location.state",
            "location.suburb",
            "location.city",
            "location.town",
          ])
          .whereRef(
            "location.id",
            "=",
            "property.location_id",
          ),
      )
        .$notNull()
        .as("location"),
      jsonArrayFrom(
        eb
          .selectFrom("contract")
          .select((eb) => [
            "contract.id",
            "contract.start_date",
            "contract.end_date",
            "contract.state",
            "contract.duration",
            "contract.formula",
            jsonArrayFrom(
              eb
                .selectFrom("contract_file")
                .innerJoin(
                  "file",
                  "file.id",
                  "contract_file.file_id",
                )
                .select(["file.basename", "file.id"])
                .whereRef(
                  "contract_file.contract_id",
                  "=",
                  "contract.id",
                ),
            ).as("files"),
          ])
          .whereRef(
            "contract.property_id",
            "=",
            "property.id",
          ),
      ).as("contracts"),
    ])
    .where("property.id", "=", id)
    .executeTakeFirst()
}
export type Property = NonNullable<
  Awaited<ReturnType<typeof fetch_property>>
>
