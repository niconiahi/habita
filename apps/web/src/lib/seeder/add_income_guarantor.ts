import { query_builder } from "../../../db/query_builder"

export async function add_income_guarantor(
  income_warranty_id: number,
  data: {
    name: string
    dni: string
    email: string
  },
): Promise<number> {
  const now = new Date().toISOString()
  const guarantor = await query_builder
    .insertInto("income_warranty_guarantor")
    .values({
      income_warranty_id,
      guarantor_name: data.name,
      guarantor_dni: data.dni,
      guarantor_email: data.email,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(
    `created income_warranty_guarantor with id ${guarantor.id}`,
  )
  return guarantor.id
}
