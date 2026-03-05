import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"
import {
  WARRANTY_TYPE,
  WarrantyTypeSchema,
} from "$lib/warranty_type"
import { LocationSchema } from "$lib/location"

const PropertyWarrantySchema = v.object({
  warranty_id: ForceNumberSchema,
  warranty_type: WarrantyTypeSchema,
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
})

const SuretyWarrantySchema = v.object({
  warranty_id: ForceNumberSchema,
  warranty_type: WarrantyTypeSchema,
  guarantor_name: v.string(),
  guarantor_dni: v.string(),
  guarantor_email: v.string(),
  company_name: v.string(),
  policy_number: v.string(),
  company_email: v.string(),
})

const IncomeWarrantySchema = v.object({
  warranty_id: ForceNumberSchema,
  warranty_type: WarrantyTypeSchema,
})

export async function update_warranty(form_data: FormData) {
  const type_validation = v.safeParse(
    WarrantyTypeSchema,
    form_data.get("warranty_type"),
  )
  if (!type_validation.success) {
    return [
      {
        update_warranty: {
          input: v.flatten(type_validation.issues),
        },
      },
      null,
    ] as const
  }

  switch (type_validation.output) {
    case WARRANTY_TYPE.PROPERTY: {
      const input_validation = v.safeParse(
        PropertyWarrantySchema,
        normalize_input(form_data, PropertyWarrantySchema),
      )
      if (!input_validation.success) {
        return [
          {
            update_warranty: {
              input: v.flatten(input_validation.issues),
            },
          },
          null,
        ] as const
      }
      const input = input_validation.output

      const [transaction_error] = await safe_async(
        query_builder.transaction().execute(async (tx) => {
          await tx
            .updateTable("warranty")
            .set({
              type: input.warranty_type,
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
              .where(
                "location.id",
                "=",
                existing.location_id,
              )
              .execute()
            await tx
              .updateTable("property_warranty")
              .set({
                guarantor_name: input.guarantor_name,
                guarantor_dni: input.guarantor_dni,
                guarantor_email: input.guarantor_email,
                cadastral_district:
                  input.cadastral_district,
                cadastral_section: input.cadastral_section,
                cadastral_block: input.cadastral_block,
                cadastral_parcel: input.cadastral_parcel,
                property_tax_id: input.property_tax_id,
                updated_at: now,
              })
              .where(
                "property_warranty.id",
                "=",
                existing.id,
              )
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
                cadastral_district:
                  input.cadastral_district,
                cadastral_section: input.cadastral_section,
                cadastral_block: input.cadastral_block,
                cadastral_parcel: input.cadastral_parcel,
                property_tax_id: input.property_tax_id,
                created_at: now,
                updated_at: now,
              })
              .execute()
          }
        }),
      )
      if (transaction_error) {
        logger.error(transaction_error.message, { warranty_id: input.warranty_id, warranty_type: input.warranty_type }, transaction_error)
        return [
          {
            update_warranty: {
              execution:
                "Error al actualizar la garantía",
            },
          },
          null,
        ] as const
      }

      return [null, null] as const
    }
    case WARRANTY_TYPE.SURETY: {
      const input_validation = v.safeParse(
        SuretyWarrantySchema,
        normalize_input(form_data, SuretyWarrantySchema),
      )
      if (!input_validation.success) {
        return [
          {
            update_warranty: {
              input: v.flatten(input_validation.issues),
            },
          },
          null,
        ] as const
      }
      const input = input_validation.output

      const [transaction_error] = await safe_async(
        query_builder.transaction().execute(async (tx) => {
          await tx
            .updateTable("warranty")
            .set({
              type: input.warranty_type,
              updated_at: now,
            })
            .where("warranty.id", "=", input.warranty_id)
            .execute()

          const existing = await tx
            .selectFrom("surety_warranty")
            .select("id")
            .where(
              "surety_warranty.warranty_id",
              "=",
              input.warranty_id,
            )
            .executeTakeFirst()

          if (existing) {
            await tx
              .updateTable("surety_warranty")
              .set({
                guarantor_name: input.guarantor_name,
                guarantor_dni: input.guarantor_dni,
                guarantor_email: input.guarantor_email,
                company_name: input.company_name,
                policy_number: input.policy_number,
                company_email: input.company_email,
                updated_at: now,
              })
              .where(
                "surety_warranty.id",
                "=",
                existing.id,
              )
              .execute()
          } else {
            await tx
              .insertInto("surety_warranty")
              .values({
                warranty_id: input.warranty_id,
                guarantor_name: input.guarantor_name,
                guarantor_dni: input.guarantor_dni,
                guarantor_email: input.guarantor_email,
                company_name: input.company_name,
                policy_number: input.policy_number,
                company_email: input.company_email,
                created_at: now,
                updated_at: now,
              })
              .execute()
          }
        }),
      )
      if (transaction_error) {
        logger.error(transaction_error.message, { warranty_id: input.warranty_id, warranty_type: input.warranty_type }, transaction_error)
        return [
          {
            update_warranty: {
              execution:
                "Error al actualizar la garantía",
            },
          },
          null,
        ] as const
      }

      return [null, null] as const
    }
    case WARRANTY_TYPE.INCOME: {
      const input_validation = v.safeParse(
        IncomeWarrantySchema,
        normalize_input(form_data, IncomeWarrantySchema),
      )
      if (!input_validation.success) {
        return [
          {
            update_warranty: {
              input: v.flatten(input_validation.issues),
            },
          },
          null,
        ] as const
      }
      const input = input_validation.output

      const [transaction_error] = await safe_async(
        query_builder.transaction().execute(async (tx) => {
          await tx
            .updateTable("warranty")
            .set({
              type: input.warranty_type,
              updated_at: now,
            })
            .where("warranty.id", "=", input.warranty_id)
            .execute()

          const existing = await tx
            .selectFrom("income_warranty")
            .select("id")
            .where(
              "income_warranty.warranty_id",
              "=",
              input.warranty_id,
            )
            .executeTakeFirst()

          if (!existing) {
            await tx
              .insertInto("income_warranty")
              .values({
                warranty_id: input.warranty_id,
                created_at: now,
                updated_at: now,
              })
              .execute()
          }
        }),
      )
      if (transaction_error) {
        logger.error(transaction_error.message, { warranty_id: input.warranty_id, warranty_type: input.warranty_type }, transaction_error)
        return [
          {
            update_warranty: {
              execution:
                "Error al actualizar la garantía",
            },
          },
          null,
        ] as const
      }

      return [null, null] as const
    }
  }
}
