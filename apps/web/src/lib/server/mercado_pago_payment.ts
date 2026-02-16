import * as v from "valibot"
import { get_origin } from "./origin"

function get_config() {
  if (!process.env.NODE_ENV)
    throw new Error("NODE_ENV is not set")
  if (!process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN)
    throw new Error(
      "MERCADO_PAGO_TEST_ACCESS_TOKEN is not set",
    )
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN)
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not set")

  const is_development =
    process.env.NODE_ENV === "development"
  return {
    is_development,
    access_token: is_development
      ? process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN
      : process.env.MERCADO_PAGO_ACCESS_TOKEN,
  }
}

const MercadoPagoPreferenceSchema = v.object({
  id: v.string(),
  init_point: v.string(),
  sandbox_init_point: v.string(),
})

interface CreatePreferenceOptions {
  title: string
  amount: number
}

export async function create_preference(
  options: CreatePreferenceOptions,
) {
  const { title, amount } = options
  const { is_development, access_token } = get_config()
  const origin = get_origin()
  const response = await fetch(
    "https://api.mercadopago.com/checkout/preferences",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        items: [
          {
            title,
            quantity: 1,
            unit_price: amount,
          },
        ],
        back_urls: {
          success: `${origin}/pay/success`,
          failure: `${origin}/pay/failure`,
          pending: `${origin}/pay/pending`,
        },
        auto_return: "approved",
        notification_url: `${origin}/webhooks/mercadopago`,
      }),
    },
  )
  if (!response.ok) {
    const error = await response.text()
    throw new Error(
      `Failed to create Mercado Pago preference: ${error}`,
    )
  }
  const data = await response.json()
  const preference = v.parse(
    MercadoPagoPreferenceSchema,
    data,
  )
  return {
    id: preference.id,
    init_point: is_development
      ? preference.sandbox_init_point
      : preference.init_point,
  }
}
