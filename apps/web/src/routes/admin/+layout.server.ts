import { is_realtor } from "$lib/server/organization"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({
  locals,
}) => {
  let is_realtor_user = false
  if (locals.user) {
    is_realtor_user = await is_realtor(locals.user.id)
  }
  return { is_realtor: is_realtor_user }
}
