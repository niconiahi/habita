import * as v from "valibot"
import { start_onboarding as api_start_onboarding } from "$lib/server/digital_signature"
import { fetch_landlord } from "$lib/server/landlord"
import { fetch_tenant } from "$lib/server/tenant"
import { get_origin } from "$lib/server/origin"

const PartySchema = v.picklist(["landlord", "tenant"])

export async function start_onboarding(
  form_data: FormData,
  property_id: number,
) {
  const party = v.parse(PartySchema, form_data.get("party"))
  const person =
    party === "landlord"
      ? await fetch_landlord(property_id)
      : await fetch_tenant(property_id)
  if (!person) {
    return {
      errors: {
        start_onboarding: "No se encontró la persona",
      },
    }
  }
  const origin = get_origin()
  const base_path = `${origin}/webhooks/digital_signature/onboarding`
  await api_start_onboarding({
    Email: person.email,
    UrlRedireccionOK: `${base_path}?party=${party}&result=ok`,
    UrlRedireccionError: `${base_path}?party=${party}&result=error`,
    UrlRedireccionRechazar: `${base_path}?party=${party}&result=rejected`,
  })
  return null
}
