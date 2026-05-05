import { require_authentication } from "$lib/server/auth"
import { query_builder } from "db/query_builder"
import { jsonObjectFrom } from "kysely/helpers/postgres"
import { decrypt } from "$lib/server/encryption"
import { get_accessible_property_ids } from "$lib/server/property_access"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { create_file } from "./actions/create_file.server"
import { update_user } from "./actions/update_user.server"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)
  const property_ids = await get_accessible_property_ids(
    locals.user.id,
  )
  const properties =
    property_ids.length > 0
      ? await fetch_properties(property_ids)
      : []
  const user_files = await fetch_user_files(locals.user.id)
  const user_profile = await fetch_user_profile(
    locals.user.id,
  )
  return {
    user: locals.user,
    properties,
    user_files,
    user_profile,
  }
}

export const actions: Actions = {
  [ACTION.CREATE_FILE]: async ({ request, locals }) => {
    require_authentication(locals)
    const form_data = await request.formData()
    return create_file(form_data, locals.user.id)
  },
  [ACTION.UPDATE_USER]: async ({ request, locals }) => {
    require_authentication(locals)
    const form_data = await request.formData()
    return update_user(form_data, locals.user.id)
  },
}

function fetch_user_files(user_id: number) {
  return query_builder
    .selectFrom("user_file")
    .innerJoin("user", "user.id", "user_file.user_id")
    .innerJoin("file", "file.id", "user_file.file_id")
    .where("user.id", "=", user_id)
    .select(["file.id", "file.basename", "user_file.type"])
    .execute()
}

function fetch_properties(property_ids: number[]) {
  return query_builder
    .selectFrom("property")
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .where("property.id", "in", property_ids)
    .select((eb) => [
      "property.id",
      jsonObjectFrom(
        eb
          .selectFrom("location")
          .select([
            "location.address",
            "location.id",
            "location.latitude",
            "location.longitude",
            "location.road",
            "location.house_number",
            "location.state",
            "location.suburb",
            "location.city",
            "location.town",
          ])
          .whereRef(
            "location.id",
            "=",
            "property.location_id",
          ),
      )
        .$notNull()
        .as("location"),
    ])
    .execute()
}
async function fetch_user_profile(user_id: number) {
  const user = await query_builder
    .selectFrom("user")
    .where("user.id", "=", user_id)
    .select([
      "user.id",
      "user.name",
      "user.surname",
      "user.email",
      "user.phone_number",
      "user.document_number",
      "user.cuil",
    ])
    .executeTakeFirstOrThrow()
  return {
    ...user,
    name: decrypt(user.name),
    surname: decrypt(user.surname),
    phone_number: user.phone_number
      ? decrypt(user.phone_number)
      : null,
    document_number: user.document_number
      ? decrypt(user.document_number)
      : null,
    cuil: user.cuil ? decrypt(user.cuil) : null,
  }
}
