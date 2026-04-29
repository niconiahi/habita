import { require_authentication } from "$lib/server/auth"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { require_edit_access } from "$lib/server/property_access"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { delete_receipt } from "./actions/delete_receipt.server"

export const load: PageServerLoad = async ({
  locals,
  params,
  parent,
  url,
}) => {
  await parent()
  require_authentication(locals, url)
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )
  const receipts = await query_builder
    .selectFrom("receipt")
    .innerJoin("file", "file.id", "receipt.file_id")
    .innerJoin(
      "contract",
      "contract.id",
      "receipt.contract_id",
    )
    .where("contract.property_id", "=", property_id)
    .select([
      "receipt.id",
      "receipt.type",
      "receipt.created_at",
      "file.id as file_id",
      "file.basename",
    ])
    .orderBy("receipt.created_at", "desc")
    .execute()
  return { receipts }
}

export const actions: Actions = {
  [ACTION.DELETE_RECEIPT]: async ({
    request,
    locals,
    params,
  }) => {
    require_authentication(locals)
    const property_id = v.parse(
      ForceNumberSchema,
      params.property_id,
    )
    await require_edit_access(
      request.headers,
      locals.user.id,
      property_id,
      locals.session.activeOrganizationId,
    )
    const form_data = await request.formData()
    const [delete_receipt_errors] =
      await delete_receipt(form_data)
    if (delete_receipt_errors) {
      return { errors: delete_receipt_errors }
    }
    return null
  },
}
