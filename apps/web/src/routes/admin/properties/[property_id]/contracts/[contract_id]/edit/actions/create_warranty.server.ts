import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"
import { now } from "$lib/server/now"
import { query_builder } from "db/query_builder"
import {
  WARRANTY_TYPE,
  WarrantyTypeSchema,
} from "$lib/warranty_type"
import { LocationSchema } from "$lib/location"

const PropertyWarrantySchema = v.object({
  contract_id: ForceNumberSchema,
  warranty_type: WarrantyTypeSchema,
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
})

const IncomeWarrantySchema = v.object({
  contract_id: ForceNumberSchema,
  warranty_type: WarrantyTypeSchema,
})

const SuretyWarrantySchema = v.object({
  contract_id: ForceNumberSchema,
  warranty_type: WarrantyTypeSchema,
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
  company_name: v.pipe(
    v.string("Nombre de la aseguradora es requerido"),
    v.minLength(1, "Nombre de la aseguradora es requerido"),
  ),
  policy_number: v.pipe(
    v.string("Número de póliza es requerido"),
    v.minLength(1, "Número de póliza es requerido"),
  ),
  company_email: v.pipe(
    v.string("Email de la aseguradora es requerido"),
    v.minLength(1, "Email de la aseguradora es requerido"),
  ),
})

function flatten_errors(issues: v.BaseIssue<unknown>[]) {
  const errors: Record<string, string> = {}
  for (const issue of issues) {
    const path =
      issue.path?.map((p) => p.key).join(".") ?? "general"
    errors[path] = issue.message
  }
  return errors
}

export async function create_warranty(form_data: FormData) {
  const warranty_type = form_data.get(
    "warranty_type",
  ) as string
  const type_result = v.safeParse(
    WarrantyTypeSchema,
    warranty_type,
  )
  if (!type_result.success) {
    return {
      errors: {
        create_warranty: {
          warranty_type: "Tipo de garantía es requerido",
        },
      },
    }
  }
  switch (type_result.output) {
    case WARRANTY_TYPE.PROPERTY: {
      const result = v.safeParse(
        PropertyWarrantySchema,
        normalize_input(form_data, PropertyWarrantySchema),
      )
      if (!result.success) {
        return {
          errors: {
            create_warranty: flatten_errors(result.issues),
          },
        }
      }
      const input = result.output
      const warranty = await query_builder
        .insertInto("warranty")
        .values({
          type: input.warranty_type,
          created_at: now,
          updated_at: now,
        })
        .returning("id")
        .executeTakeFirstOrThrow()
      const location = await query_builder
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
      await query_builder
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
      await query_builder
        .updateTable("contract")
        .set({ warranty_id: warranty.id, updated_at: now })
        .where("contract.id", "=", input.contract_id)
        .execute()
      break
    }
    case WARRANTY_TYPE.INCOME: {
      const result = v.safeParse(
        IncomeWarrantySchema,
        normalize_input(form_data, IncomeWarrantySchema),
      )
      if (!result.success) {
        return {
          errors: {
            create_warranty: flatten_errors(result.issues),
          },
        }
      }
      const input = result.output
      const warranty = await query_builder
        .insertInto("warranty")
        .values({
          type: input.warranty_type,
          created_at: now,
          updated_at: now,
        })
        .returning("id")
        .executeTakeFirstOrThrow()
      await query_builder
        .insertInto("income_warranty")
        .values({
          warranty_id: warranty.id,
          created_at: now,
          updated_at: now,
        })
        .execute()
      await query_builder
        .updateTable("contract")
        .set({ warranty_id: warranty.id, updated_at: now })
        .where("contract.id", "=", input.contract_id)
        .execute()
      break
    }
    case WARRANTY_TYPE.SURETY: {
      const result = v.safeParse(
        SuretyWarrantySchema,
        normalize_input(form_data, SuretyWarrantySchema),
      )
      if (!result.success) {
        return {
          errors: {
            create_warranty: flatten_errors(result.issues),
          },
        }
      }
      const input = result.output
      const warranty = await query_builder
        .insertInto("warranty")
        .values({
          type: input.warranty_type,
          created_at: now,
          updated_at: now,
        })
        .returning("id")
        .executeTakeFirstOrThrow()
      await query_builder
        .insertInto("surety_warranty")
        .values({
          warranty_id: warranty.id,
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
      await query_builder
        .updateTable("contract")
        .set({ warranty_id: warranty.id, updated_at: now })
        .where("contract.id", "=", input.contract_id)
        .execute()
      break
    }
  }
  return null
}
