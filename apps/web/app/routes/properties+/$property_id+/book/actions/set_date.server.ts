import * as v from "valibot"
import { get_date } from "~/lib/date"
import { ForceDateSchema } from "~/lib/force_date.server"
import {
  get_errors,
  normalize_input,
} from "~/lib/form.server"

export const InputSchema = v.object({
  date: ForceDateSchema,
})

export async function execute(
  request: Request,
  form_data: FormData,
) {
  const input = v.parse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  const url = new URL(request.url)
  url.searchParams.set("date", get_date(input.date))
  return { redirect_to: url.toString() }
}

export const set_date = {
  execute,
  get_errors: (error: v.ValiError<typeof InputSchema>) => {
    return get_errors<typeof InputSchema>(error)
  },
}
