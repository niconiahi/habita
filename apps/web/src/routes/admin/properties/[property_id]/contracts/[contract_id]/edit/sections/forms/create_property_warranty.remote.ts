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

export const create_property_warranty = form(
  v.object({
    contract_id: RemoteNumberSchema,
    property_id: RemoteNumberSchema,
    guarantor_name: v.pipe(
      v.string("Nombre del garante es requerido"),
      v.minLength(1, "Nombre del garante es requerido"),
    ),
    guarantor_dni: v.pipe(
      v.string("DNI del garante es requerido"),
      v.minLength(1, "DNI del garante es requerido"),
    ),
    guarantor_email: v.pipe(
      v.string("Email del garante es requerido"),
      v.minLength(1, "Email del garante es requerido"),
    ),
    location: v.pipe(
      v.string("Dirección es requerida"),
      v.transform((val) => {
        const parsed = JSON.parse(val)
        if (parsed === null)
          throw new Error(
            "Dirección es requerida - seleccionar del listado",
          )
        return parsed
      }),
      LocationSchema,
    ),
    cadastral_district: v.pipe(
      v.string("Circunscripción es requerida"),
      v.minLength(1, "Circunscripción es requerida"),
    ),
    cadastral_section: v.pipe(
      v.string("Sección es requerida"),
      v.minLength(1, "Sección es requerida"),
    ),
    cadastral_block: v.pipe(
      v.string("Manzana es requerida"),
      v.minLength(1, "Manzana es requerida"),
    ),
    cadastral_parcel: v.pipe(
      v.string("Parcela es requerida"),
      v.minLength(1, "Parcela es requerida"),
    ),
    property_tax_id: v.pipe(
      v.string("Partida inmobiliaria es requerida"),
      v.minLength(1, "Partida inmobiliaria es requerida"),
    ),
  }),
  async (input) => {
    await require_contract_edit_access_remote(input)
    try {
      await query_builder.transaction().execute(async (tx) => {
        const warranty = await tx
          .insertInto("warranty")
          .values({
            type: WARRANTY_TYPE.PROPERTY,
            created_at: now,
            updated_at: now,
          })
          .returning("id")
          .executeTakeFirstOrThrow()
        const location = await tx
          .insertInto("location")
          .values({
            latitude: String(input.location.lat),
            longitude: String(input.location.lon),
            address: input.location.display_name,
            road: input.location.address.road,
            house_number: input.location.address.house_number,
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
            warranty_id: warranty.id,
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
        await tx
          .updateTable("contract")
          .set({
            warranty_id: warranty.id,
            updated_at: now,
          })
          .where("contract.id", "=", input.contract_id)
          .execute()
      })
      return { ok: true as const }
    } catch (err) {
      if (err instanceof Error)
        logger.error(
          err.message,
          { contract_id: input.contract_id },
          err,
        )
      else logger.unknown(err)
      error(500, "Error al crear la garantía")
    }
  },
)
