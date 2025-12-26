import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { ForceNumberSchema } from "$lib/force_number"
import { USER_FILE_TYPE } from "$lib/user_file_type"
import { fetch_property } from "../fetchers/property.server"
import { fetch_user_files } from "../fetchers/user_files.server"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  params,
  locals,
}) => {
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )
  const property = await fetch_property(property_id)
  if (!property) {
    error(
      404,
      `property does not exist for id ${property_id}`,
    )
  }
  let has_credit_report = false
  if (locals.user) {
    const user_files = await fetch_user_files(
      locals.user.id,
    )
    has_credit_report = user_files.some(
      (file) => file.type === USER_FILE_TYPE.CREDIT_REPORT,
    )
  }
  return { property, has_credit_report }
}
