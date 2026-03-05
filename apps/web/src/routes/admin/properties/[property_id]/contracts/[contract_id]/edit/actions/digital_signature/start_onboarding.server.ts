import * as v from "valibot"
import {
  start_onboarding as api_start_onboarding,
  API_FETCH_ERROR,
} from "$lib/server/digital_signature"
import { normalize_input } from "$lib/server/form"
import { fetch_landlord } from "$lib/server/landlord"
import { fetch_tenant } from "$lib/server/tenant"
import { get_origin } from "$lib/server/origin"

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
    return [
      {
        start_onboarding: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const person =
    input.party === "landlord"
      ? await fetch_landlord(property_id)
      : await fetch_tenant(property_id)
  if (!person) {
    return [
      {
        start_onboarding: {
          execution: "No se encontró la persona",
        },
      },
      null,
    ] as const
  }
  const origin = get_origin()
  const base_path = `${origin}/webhooks/digital_signature/onboarding`
  const [onboarding_error] = await api_start_onboarding({
    Email: person.email,
    UrlRedireccionOK: `${base_path}?party=${input.party}&result=ok`,
    UrlRedireccionError: `${base_path}?party=${input.party}&result=error`,
    UrlRedireccionRechazar: `${base_path}?party=${input.party}&result=rejected`,
  })
  if (onboarding_error) {
    if (
      onboarding_error.type ===
      API_FETCH_ERROR.FETCH_FAILED
    ) {
      return [
        {
          start_onboarding: {
            execution:
              "No se pudo conectar al servicio de registro",
          },
        },
        null,
      ] as const
    }
    if (
      onboarding_error.type === API_FETCH_ERROR.API_ERROR
    ) {
      return [
        {
          start_onboarding: {
            execution:
              "Error en el servicio de registro",
          },
        },
        null,
      ] as const
    }
    if (
      onboarding_error.type ===
      API_FETCH_ERROR.JSON_PARSE_FAILED
    ) {
      return [
        {
          start_onboarding: {
            execution:
              "Respuesta inválida del servicio de registro",
          },
        },
        null,
      ] as const
    }
    if (
      onboarding_error.type ===
      API_FETCH_ERROR.SCHEMA_VALIDATION_FAILED
    ) {
      return [
        {
          start_onboarding: {
            execution:
              "Respuesta inesperada del servicio de registro",
          },
        },
        null,
      ] as const
    }
    return [
      {
        start_onboarding: {
          execution: "Error al iniciar el registro",
        },
      },
      null,
    ] as const
  }
  return [null, null] as const
}
