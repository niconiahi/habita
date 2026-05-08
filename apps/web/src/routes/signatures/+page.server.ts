import { error } from "@sveltejs/kit"
import { require_authentication } from "$lib/server/auth"
import { query_builder } from "db/query_builder"
import { ACCESS_TYPE } from "$lib/access_type"
import { is_webmaster } from "$lib/server/is_webmaster"
import type { PageServerLoad } from "./$types"

function fetch_signature_documents(user_id: number) {
  return query_builder
    .selectFrom("contract")
    .innerJoin(
      "property",
      "property.id",
      "contract.property_id",
    )
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .innerJoin(
      "property_access",
      "property_access.property_id",
      "property.id",
    )
    .leftJoin(
      "digital_signature",
      "digital_signature.contract_id",
      "contract.id",
    )
    .where("property_access.user_id", "=", user_id)
    .where("property_access.type", "in", [
      ACCESS_TYPE.LANDLORD,
      ACCESS_TYPE.TENANT,
    ])
    .where("digital_signature.id", "is not", null)
    .select([
      "contract.id as contract_id",
      "contract.state as contract_state",
      "location.road",
      "location.house_number",
      "location.city",
      "property_access.type as access_type",
      "digital_signature.landlord_status",
      "digital_signature.tenant_status",
      "digital_signature.landlord_url",
      "digital_signature.tenant_url",
    ])
    .execute()
}

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)
  if (!is_webmaster(locals.user)) {
    error(404, "Not found")
  }
  const documents = await fetch_signature_documents(
    locals.user.id,
  )
  return { documents }
}
