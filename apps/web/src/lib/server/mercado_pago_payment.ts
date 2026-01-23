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

interface CreatePreferenceResponse {
  id: string
  init_point: string
}

export async function create_preference(
  title: string,
  amount: number,
): Promise<CreatePreferenceResponse> {
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
        },
        auto_return: "approved",
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
  return {
    id: data.id,
    init_point: is_development
      ? data.sandbox_init_point
      : data.init_point,
  }
}
