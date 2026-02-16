import { query_builder } from "../../../db/query_builder"

export async function create_property_warranty(
  warranty_id: number,
  location_id: number,
  data: {
    guarantor_name: string
    guarantor_dni: string
    guarantor_email: string
    cadastral_district: string
    cadastral_section: string
    cadastral_block: string
    cadastral_parcel: string
    property_tax_id: string
  },
): Promise<number> {
  const now = new Date().toISOString()
  const property_warranty = await query_builder
    .insertInto("property_warranty")
    .values({
      warranty_id,
      location_id,
      guarantor_name: data.guarantor_name,
      guarantor_dni: data.guarantor_dni,
      guarantor_email: data.guarantor_email,
      cadastral_district: data.cadastral_district,
      cadastral_section: data.cadastral_section,
      cadastral_block: data.cadastral_block,
      cadastral_parcel: data.cadastral_parcel,
      property_tax_id: data.property_tax_id,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(
    `created property_warranty with id ${property_warranty.id}`,
  )
  return property_warranty.id
}
