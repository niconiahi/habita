import { query_builder } from "db/query_builder"
import { now } from "$lib/server/now"
import { create_preference } from "$lib/server/mercado_pago_payment"

const PAYMENT_METHOD_MERCADO_PAGO = 1
const PAYMENT_STATUS_PENDING = 0

export async function create_payment(): Promise<string> {
  const preference = await create_preference(
    "Pago de prueba",
    50,
  )
  const payment = await query_builder
    .insertInto("payment")
    .values({
      payment_method_id: PAYMENT_METHOD_MERCADO_PAGO,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  await query_builder
    .insertInto("payment_mercado_pago")
    .values({
      preference_id: preference.id,
      status: PAYMENT_STATUS_PENDING,
      payment_id: payment.id,
      created_at: now,
      updated_at: now,
    })
    .execute()
  return preference.init_point
}
