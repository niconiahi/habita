import { sql } from "kysely"
import {
  jsonArrayFrom,
  jsonObjectFrom,
} from "kysely/helpers/postgres"
import { query_builder } from "db/query_builder"
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
      "property.destinies",
      "property.state",
      jsonArrayFrom(
        eb
          .selectFrom("room")
          .leftJoin(
            "room_map",
            "room_map.room_id",
            "room.id",
          )
          .select([
            "room.id",
            "room.type",
            "room.width",
            "room.length",
            "room_map.position_x",
            "room_map.position_y",
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
          .innerJoin("member", "member.user_id", "user.id")
          .whereRef(
            "member.organization_id",
            "=",
            "property.organization_id",
          )
          .select([
            "user.id",
            "user.name",
            "user.surname",
            "user.phone_number",
            "user.document_number",
            "member.role",
          ]),
      ).as("members"),
      jsonArrayFrom(
        eb
          .selectFrom("property_file")
          .innerJoin(
            "file",
            "file.id",
            "property_file.file_id",
          )
          .select([
            "file.basename",
            "file.id",
            sql<string>`encode(file.content, 'base64')`.as(
              "content",
            ),
            "property_file.type",
          ])
          .whereRef(
            "property_file.property_id",
            "=",
            "property.id",
          ),
      ).as("images"),
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
