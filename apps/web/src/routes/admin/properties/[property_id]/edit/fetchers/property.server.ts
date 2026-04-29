import { query_builder } from "db/query_builder"
import {
  jsonArrayFrom,
  jsonObjectFrom,
} from "kysely/helpers/postgres"
import { decrypt } from "$lib/server/encryption"

export async function fetch_property(id: number) {
  const property = await query_builder
    .selectFrom("property")
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .select((eb) => [
      "property.id",
      "property.created_at",
      "property.unit",
      "property.type",
      "property.destinies",
      "property.state",
      "property.construction_year",
      jsonArrayFrom(
        eb
          .selectFrom("floor")
          .select((eb) => [
            "floor.id",
            "floor.number",
            jsonArrayFrom(
              eb
                .selectFrom("room")
                .leftJoin(
                  "room_map",
                  "room_map.room_id",
                  "room.id",
                )
                .select((eb) => [
                  "room.id",
                  "room.type",
                  "room.width",
                  "room.length",
                  "room_map.position_x",
                  "room_map.position_y",
                  jsonArrayFrom(
                    eb
                      .selectFrom("room_file")
                      .innerJoin(
                        "file",
                        "file.id",
                        "room_file.file_id",
                      )
                      .select([
                        "room_file.id as room_file_id",
                        "file.id",
                        "file.basename",
                        "file.hash",
                      ])
                      .whereRef(
                        "room_file.room_id",
                        "=",
                        "room.id",
                      ),
                  ).as("photos"),
                ])
                .whereRef("room.floor_id", "=", "floor.id"),
            ).as("rooms"),
          ])
          .whereRef("floor.property_id", "=", "property.id")
          .orderBy("floor.number", "asc"),
      ).as("floors"),
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
            jsonArrayFrom(
              eb
                .selectFrom("period")
                .innerJoin(
                  "contract",
                  "contract.id",
                  "period.contract_id",
                )
                .select([
                  "period.id",
                  "period.price",
                  "period.start_date",
                  "period.end_date",
                ])
                .whereRef(
                  "period.contract_id",
                  "=",
                  "contract.id",
                ),
            ).as("periods"),
            eb
              .selectFrom("period")
              .select("period.price")
              .whereRef(
                "period.contract_id",
                "=",
                "contract.id",
              )
              .orderBy("period.created_at", "asc")
              .limit(1)
              .as("initial_price"),
            jsonArrayFrom(
              eb
                .selectFrom("contract_file")
                .innerJoin(
                  "file",
                  "file.id",
                  "contract_file.file_id",
                )
                .select([
                  "file.basename",
                  "file.id",
                  "contract_file.type",
                ])
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
      jsonArrayFrom(
        eb
          .selectFrom("property_tag")
          .select(["property_tag.id", "property_tag.type"])
          .whereRef(
            "property_tag.property_id",
            "=",
            "property.id",
          ),
      ).as("tags"),
      jsonArrayFrom(
        eb
          .selectFrom("service")
          .select([
            "service.id",
            "service.code",
            "service.type",
          ])
          .whereRef(
            "service.property_id",
            "=",
            "property.id",
          ),
      ).as("services"),
      jsonArrayFrom(
        eb
          .selectFrom("user")
          .innerJoin(
            "property_access",
            "property_access.user_id",
            "user.id",
          )
          .whereRef(
            "property_access.property_id",
            "=",
            "property.id",
          )
          .select([
            "user.id",
            "user.name",
            "user.surname",
            "user.phone_number",
            "user.document_number",
            "user.image",
            "property_access.type",
          ]),
      ).as("members"),
    ])
    .where("property.id", "=", id)
    .executeTakeFirst()
  if (!property) return undefined
  return {
    ...property,
    members: property.members.map((member) => ({
      ...member,
      name: decrypt(member.name),
      surname: decrypt(member.surname),
      phone_number: member.phone_number
        ? decrypt(member.phone_number)
        : null,
      document_number: member.document_number
        ? decrypt(member.document_number)
        : null,
    })),
  }
}

export type Property = NonNullable<
  Awaited<ReturnType<typeof fetch_property>>
>
