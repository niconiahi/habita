import * as v from "valibot"
import type { ObjectValues } from "$lib/compose_types"
import { logger } from "$lib/telemetry/logger"
import { get_origin } from "./origin"

export const CREATE_PREFERENCE_ERROR = {
  FETCH_FAILED: 0,
  API_ERROR: 1,
  JSON_PARSE_FAILED: 2,
  SCHEMA_VALIDATION_FAILED: 3,
} as const

export class CreatePreferenceError extends Error {
  constructor(
    public type: ObjectValues<
      typeof CREATE_PREFERENCE_ERROR
    >,
    cause: Error,
  ) {
    super(cause.message, { cause })
  }
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
): Promise<{ id: string; init_point: string }> {
  const { title, amount, back_urls } = options
  const { is_development, access_token } = get_config()
  const origin = get_origin()
  const resolved_back_urls = back_urls ?? {
    success: `${origin}/pay/success`,
    failure: `${origin}/pay/failure`,
    pending: `${origin}/pay/pending`,
  }

  let response: Response
  try {
    response = await fetch(
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
    )
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, {}, error)
      throw new CreatePreferenceError(
        CREATE_PREFERENCE_ERROR.FETCH_FAILED,
        error,
      )
    } else {
      logger.unknown(error)
      throw new CreatePreferenceError(
        CREATE_PREFERENCE_ERROR.FETCH_FAILED,
        new Error("unknown error"),
      )
    }
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
    throw new CreatePreferenceError(
      CREATE_PREFERENCE_ERROR.API_ERROR,
      preference_error,
    )
  }

  let data: unknown
  try {
    data = await response.json()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, {}, error)
      throw new CreatePreferenceError(
        CREATE_PREFERENCE_ERROR.JSON_PARSE_FAILED,
        error,
      )
    } else {
      logger.unknown(error)
      throw new CreatePreferenceError(
        CREATE_PREFERENCE_ERROR.JSON_PARSE_FAILED,
        new Error("unknown error"),
      )
    }
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
    throw new CreatePreferenceError(
      CREATE_PREFERENCE_ERROR.SCHEMA_VALIDATION_FAILED,
      parse_error,
    )
  }
  const preference = preference_validation.output

  return {
    id: preference.id,
    init_point: is_development
      ? preference.sandbox_init_point
      : preference.init_point,
  }
}
