import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { form } from "$app/server"
import { query_builder } from "db/query_builder"
import { LocationSchema } from "$lib/location"
import { RemoteNumberSchema } from "$lib/remote_number"
import { now } from "$lib/server/now"
import { require_contract_edit_access_remote } from "$lib/server/auth/require_contract_edit_access_remote"
import { logger } from "$lib/telemetry/logger"
import { WARRANTY_TYPE } from "$lib/warranty_type"

export const update_property_warranty = form(
  v.object({
    warranty_id: RemoteNumberSchema,
    contract_id: RemoteNumberSchema,
    property_id: RemoteNumberSchema,
    guarantor_name: v.string(),
    guarantor_dni: v.string(),
    guarantor_email: v.string(),
    location: v.pipe(
      v.string(),
      v.transform((val) => JSON.parse(val)),
      LocationSchema,
    ),
    cadastral_district: v.string(),
    cadastral_section: v.string(),
    cadastral_block: v.string(),
    cadastral_parcel: v.string(),
    property_tax_id: v.string(),
  }),
  async (input) => {
    await require_contract_edit_access_remote(input)
    try {
      await query_builder.transaction().execute(async (tx) => {
        await tx
          .updateTable("warranty")
          .set({
            type: WARRANTY_TYPE.PROPERTY,
            updated_at: now,
          })
          .where("warranty.id", "=", input.warranty_id)
          .execute()
        const existing = await tx
          .selectFrom("property_warranty")
          .select(["id", "location_id"])
          .where(
            "property_warranty.warranty_id",
            "=",
            input.warranty_id,
          )
          .executeTakeFirst()
        if (existing) {
          await tx
            .updateTable("location")
            .set({
              latitude: String(input.location.lat),
              longitude: String(input.location.lon),
              address: input.location.display_name,
              road: input.location.address.road,
              house_number:
                input.location.address.house_number,
              suburb: input.location.address.suburb,
              city: input.location.address.city,
              town: input.location.address.town,
              state: input.location.address.state,
              point: `POINT(${input.location.lon} ${input.location.lat})`,
              updated_at: now,
            })
            .where("location.id", "=", existing.location_id)
            .execute()
          await tx
            .updateTable("property_warranty")
            .set({
              guarantor_name: input.guarantor_name,
              guarantor_dni: input.guarantor_dni,
              guarantor_email: input.guarantor_email,
              cadastral_district: input.cadastral_district,
              cadastral_section: input.cadastral_section,
              cadastral_block: input.cadastral_block,
              cadastral_parcel: input.cadastral_parcel,
              property_tax_id: input.property_tax_id,
              updated_at: now,
            })
            .where("property_warranty.id", "=", existing.id)
            .execute()
        } else {
          const location = await tx
            .insertInto("location")
            .values({
              latitude: String(input.location.lat),
              longitude: String(input.location.lon),
              address: input.location.display_name,
              road: input.location.address.road,
              house_number:
                input.location.address.house_number,
              suburb: input.location.address.suburb,
              city: input.location.address.city,
              town: input.location.address.town,
              state: input.location.address.state,
              point: `POINT(${input.location.lon} ${input.location.lat})`,
              created_at: now,
              updated_at: now,
            })
            .returning("id")
            .executeTakeFirstOrThrow()
          await tx
            .insertInto("property_warranty")
            .values({
              warranty_id: input.warranty_id,
              guarantor_name: input.guarantor_name,
              guarantor_dni: input.guarantor_dni,
              guarantor_email: input.guarantor_email,
              location_id: location.id,
              cadastral_district: input.cadastral_district,
              cadastral_section: input.cadastral_section,
              cadastral_block: input.cadastral_block,
              cadastral_parcel: input.cadastral_parcel,
              property_tax_id: input.property_tax_id,
              created_at: now,
              updated_at: now,
            })
            .execute()
        }
      })
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          { warranty_id: input.warranty_id },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al actualizar la garantía")
    }
  },
)
