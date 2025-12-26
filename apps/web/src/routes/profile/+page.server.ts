import { redirect, error } from "@sveltejs/kit"
import { jsonObjectFrom } from "kysely/helpers/postgres"
import { query_builder } from "db/query_builder"
import { has_edit_access } from "$lib/server/property_access"
import { create_file } from "./actions/create_file.server"
import { ACTION } from "./actions/action"
import type { PageServerLoad, Actions } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  const property_ids = locals.user.accesses.map(
    (access) => access.property_id,
  )
  const properties =
    property_ids.length > 0
      ? await fetch_properties(property_ids)
      : []
  const user_files = await fetch_user_files(locals.user.id)
  return { user: locals.user, properties, user_files }
}

export const actions: Actions = {
  [ACTION.CREATE_FILE]: async ({ request, locals }) => {
    if (!locals.user) {
      redirect(302, "/auth/google")
    }
    if (!has_edit_access(locals.user.accesses)) {
      error(400, "not found")
    }
    const form_data = await request.formData()
    await create_file(form_data, locals.user.id)
    return null
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
