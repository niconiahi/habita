import { sql } from "kysely"
import {
  jsonArrayFrom,
  jsonObjectFrom,
} from "kysely/helpers/postgres"
import { PROPERTY_STATE } from "$lib/property_state"
import { ROOM_TYPE } from "$lib/room_type"
import type { PropertyTagType } from "$lib/property_tag_type"
import { query_builder } from "db/query_builder"

export interface PropertyFilters {
  tag_types?: PropertyTagType[]
  service_types?: number[]
  ambientes_min?: number
  ambientes_max?: number
  dormitorios_min?: number
  dormitorios_max?: number
  banos_min?: number
  banos_max?: number
  total_surface_min?: number
  total_surface_max?: number
  construction_year_min?: number
  construction_year_max?: number
}

export async function fetch_properties(filters?: PropertyFilters) {
  let query = query_builder
    .selectFrom("property")
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .select((eb) => [
      "property.id",
      "property.state",
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
            eb
              .selectFrom("period")
              .select("period.price")
              .whereRef(
                "period.contract_id",
                "=",
                "contract.id",
              )
              .orderBy("period.created_at", "desc")
              .limit(1)
              .as("current_price"),
          ])
          .whereRef(
            "contract.property_id",
            "=",
            "property.id",
          ),
      ).as("contracts"),
      jsonArrayFrom(
        eb
          .selectFrom("property_file")
          .innerJoin(
            "file",
            "file.id",
            "property_file.file_id",
          )
          .select([
            "file.id",
            "file.hash",
            "property_file.type",
          ])
          .whereRef(
            "property_file.property_id",
            "=",
            "property.id",
          )
          .orderBy("property_file.id", "asc"),
      ).as("images"),
    ])
    .where("property.state", "=", PROPERTY_STATE.PUBLISHED)
  if (filters) {
    for (const tag_type of filters.tag_types ?? []) {
      query = query.where((eb) =>
        eb.exists(
          eb
            .selectFrom("property_tag")
            .select(sql.lit(1).as("one"))
            .whereRef("property_tag.property_id", "=", "property.id")
            .where("property_tag.type", "=", tag_type),
        ),
      )
    }
    for (const service_type of filters.service_types ?? []) {
      query = query.where((eb) =>
        eb.exists(
          eb
            .selectFrom("service")
            .select(sql.lit(1).as("one"))
            .whereRef("service.property_id", "=", "property.id")
            .where("service.type", "=", service_type),
        ),
      )
    }
    if (filters.construction_year_min !== undefined) {
      query = query.where(
        "property.construction_year",
        ">=",
        filters.construction_year_min,
      )
    }
    if (filters.construction_year_max !== undefined) {
      query = query.where(
        "property.construction_year",
        "<=",
        filters.construction_year_max,
      )
    }
    if (filters.total_surface_min !== undefined) {
      query = query.where((eb) =>
        eb(
          eb
            .selectFrom("room")
            .select(sql<number>`coalesce(sum(room.width * room.length), 0)`.as("total"))
            .whereRef("room.property_id", "=", "property.id"),
          ">=",
          filters.total_surface_min!,
        ),
      )
    }
    if (filters.total_surface_max !== undefined) {
      query = query.where((eb) =>
        eb(
          eb
            .selectFrom("room")
            .select(sql<number>`coalesce(sum(room.width * room.length), 0)`.as("total"))
            .whereRef("room.property_id", "=", "property.id"),
          "<=",
          filters.total_surface_max!,
        ),
      )
    }
    if (filters.ambientes_min !== undefined) {
      query = query.where((eb) =>
        eb(
          eb
            .selectFrom("room")
            .select(eb.fn.countAll<number>().as("cnt"))
            .whereRef("room.property_id", "=", "property.id"),
          ">=",
          filters.ambientes_min!,
        ),
      )
    }
    if (filters.ambientes_max !== undefined) {
      query = query.where((eb) =>
        eb(
          eb
            .selectFrom("room")
            .select(eb.fn.countAll<number>().as("cnt"))
            .whereRef("room.property_id", "=", "property.id"),
          "<=",
          filters.ambientes_max!,
        ),
      )
    }
    if (filters.dormitorios_min !== undefined) {
      query = query.where((eb) =>
        eb(
          eb
            .selectFrom("room")
            .select(eb.fn.countAll<number>().as("cnt"))
            .whereRef("room.property_id", "=", "property.id")
            .where("room.type", "=", ROOM_TYPE.BEDROOM),
          ">=",
          filters.dormitorios_min!,
        ),
      )
    }
    if (filters.dormitorios_max !== undefined) {
      query = query.where((eb) =>
        eb(
          eb
            .selectFrom("room")
            .select(eb.fn.countAll<number>().as("cnt"))
            .whereRef("room.property_id", "=", "property.id")
            .where("room.type", "=", ROOM_TYPE.BEDROOM),
          "<=",
          filters.dormitorios_max!,
        ),
      )
    }
    if (filters.banos_min !== undefined) {
      query = query.where((eb) =>
        eb(
          eb
            .selectFrom("room")
            .select(eb.fn.countAll<number>().as("cnt"))
            .whereRef("room.property_id", "=", "property.id")
            .where("room.type", "=", ROOM_TYPE.BATHROOM),
          ">=",
          filters.banos_min!,
        ),
      )
    }
    if (filters.banos_max !== undefined) {
      query = query.where((eb) =>
        eb(
          eb
            .selectFrom("room")
            .select(eb.fn.countAll<number>().as("cnt"))
            .whereRef("room.property_id", "=", "property.id")
            .where("room.type", "=", ROOM_TYPE.BATHROOM),
          "<=",
          filters.banos_max!,
        ),
      )
    }
  }
  return query.execute()
}

export type Property = NonNullable<
  Awaited<ReturnType<typeof fetch_properties>>[0]
>
