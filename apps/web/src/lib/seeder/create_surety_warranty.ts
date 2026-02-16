import { query_builder } from "../../../db/query_builder"

export async function create_surety_warranty(
  warranty_id: number,
  data: {
    company_name: string
    company_email: string
    policy_number: string
    guarantor_name: string
    guarantor_dni: string
    guarantor_email: string
  },
): Promise<number> {
  const now = new Date().toISOString()
  const surety_warranty = await query_builder
    .insertInto("surety_warranty")
    .values({
      warranty_id,
      company_name: data.company_name,
      company_email: data.company_email,
      policy_number: data.policy_number,
      guarantor_name: data.guarantor_name,
      guarantor_dni: data.guarantor_dni,
      guarantor_email: data.guarantor_email,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(
    `created surety_warranty with id ${surety_warranty.id}`,
  )
  return surety_warranty.id
}
