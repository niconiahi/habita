import { require_authentication } from "$lib/server/auth"
import { get_property_destinies } from "$lib/property_destiny"
import { get_property_types } from "$lib/property_type"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)
  return {
    property_types: get_property_types(),
    property_destinies: get_property_destinies(),
  }
}
