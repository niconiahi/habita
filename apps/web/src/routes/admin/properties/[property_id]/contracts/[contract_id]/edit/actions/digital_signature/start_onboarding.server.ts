import * as v from "valibot"
import { fail } from "@sveltejs/kit"
import {
  API_FETCH_ERROR,
  ApiFetchError,
  start_onboarding as api_start_onboarding,
} from "$lib/server/digital_signature"
import { normalize_input } from "$lib/server/form"
import { fetch_landlord } from "$lib/server/landlord"
import { get_origin } from "$lib/server/origin"
import { fetch_tenant } from "$lib/server/tenant"
import { logger } from "$lib/telemetry/logger"

const PartySchema = v.picklist(["landlord", "tenant"])

const InputSchema = v.object({
  party: PartySchema,
})

export async function start_onboarding(
  form_data: FormData,
  property_id: number,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const input = input_validation.output

  const person =
    input.party === "landlord"
      ? await fetch_landlord(property_id)
      : await fetch_tenant(property_id)
  if (!person) {
    return fail(400, {
      message: "No se encontró la persona",
    })
  }
  const origin = get_origin()
  const base_path = `${origin}/webhooks/digital_signature/onboarding`

  try {
    await api_start_onboarding({
      Email: person.email,
      UrlRedireccionOK: `${base_path}?party=${input.party}&result=ok`,
      UrlRedireccionError: `${base_path}?party=${input.party}&result=error`,
      UrlRedireccionRechazar: `${base_path}?party=${input.party}&result=rejected`,
    })
  } catch (error) {
    if (error instanceof ApiFetchError) {
      if (error.type === API_FETCH_ERROR.FETCH_FAILED) {
        return fail(400, {
          message:
            "No se pudo conectar al servicio de registro",
        })
      }
      if (error.type === API_FETCH_ERROR.API_ERROR) {
        return fail(400, {
          message: "Error en el servicio de registro",
        })
      }
      if (
        error.type === API_FETCH_ERROR.JSON_PARSE_FAILED
      ) {
        return fail(400, {
          message:
            "Respuesta inválida del servicio de registro",
        })
      }
      if (
        error.type ===
        API_FETCH_ERROR.SCHEMA_VALIDATION_FAILED
      ) {
        return fail(400, {
          message:
            "Respuesta inesperada del servicio de registro",
        })
      }
      return fail(400, {
        message: "Error al iniciar el registro",
      })
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al iniciar el registro",
    })
  }

  logger.info("digital signature onboarding started", {
    property_id,
    party: input.party,
  })
}
