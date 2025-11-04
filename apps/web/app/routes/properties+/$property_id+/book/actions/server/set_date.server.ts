import * as v from "valibot"
import { get_date } from "~/lib/date"
import { ForceDateSchema } from "~/lib/server/force_date.server"

export async function set_date(
  request: Request,
  form_data: FormData,
) {
  const date = v.parse(
    ForceDateSchema,
    form_data.get("date"),
  )
  const url = new URL(request.url)
  url.searchParams.set("date", get_date(date))
  return { redirect_to: url.toString() }
}
