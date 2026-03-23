import * as v from "valibot"
import { safe_async } from "$lib/safe_async"
import type { ObjectValues } from "$lib/compose_types"
import { logger } from "$lib/telemetry/logger"
import { get_origin } from "./origin"

export const CREATE_PREFERENCE_ERROR = {
  FETCH_FAILED: 0,
  API_ERROR: 1,
  JSON_PARSE_FAILED: 2,
  SCHEMA_VALIDATION_FAILED: 3,
} as const

// NOTE: newly added error
export type CreatePreferenceError = {
  type: ObjectValues<typeof CREATE_PREFERENCE_ERROR>
  error: Error
}

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
  back_urls?: {
    success: string
    failure: string
    pending: string
  }
}

export async function create_preference(
  options: CreatePreferenceOptions,
): Promise<
  | [CreatePreferenceError, null]
  | [null, { id: string; init_point: string }]
> {
  const { title, amount, back_urls } = options
  const { is_development, access_token } = get_config()
  const origin = get_origin()
  const resolved_back_urls = back_urls ?? {
    success: `${origin}/pay/success`,
    failure: `${origin}/pay/failure`,
    pending: `${origin}/pay/pending`,
  }
  // NOTE: new safe implementation
  const [fetch_error, response] = await safe_async(
    fetch(
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
          back_urls: resolved_back_urls,
          auto_return: "approved",
          notification_url: `${origin}/webhooks/mercadopago`,
        }),
      },
    ),
  )
  if (fetch_error) {
    logger.error(fetch_error.message, {}, fetch_error)
    return [
      {
        type: CREATE_PREFERENCE_ERROR.FETCH_FAILED,
        error: fetch_error,
      },
      null,
    ]
  }

  if (!response.ok) {
    const error_text = await response.text()
    const preference_error = new Error(
      `Failed to create Mercado Pago preference: ${error_text}`,
    )
    logger.error(
      preference_error.message,
      {},
      preference_error,
    )
    return [
      {
        type: CREATE_PREFERENCE_ERROR.API_ERROR,
        error: preference_error,
      },
      null,
    ]
  }

  const [json_error, data] = await safe_async(
    response.json(),
  )
  if (json_error) {
    logger.error(json_error.message, {}, json_error)
    return [
      {
        type: CREATE_PREFERENCE_ERROR.JSON_PARSE_FAILED,
        error: json_error,
      },
      null,
    ]
  }

  const preference_validation = v.safeParse(
    MercadoPagoPreferenceSchema,
    data,
  )
  if (!preference_validation.success) {
    const parse_error = new Error(
      "Schema validation failed",
    )
    logger.error(parse_error.message, {}, parse_error)
    return [
      {
        type: CREATE_PREFERENCE_ERROR.SCHEMA_VALIDATION_FAILED,
        error: parse_error,
      },
      null,
    ]
  }
  const preference = preference_validation.output

  return [
    null,
    {
      id: preference.id,
      init_point: is_development
        ? preference.sandbox_init_point
        : preference.init_point,
    },
  ]
}
