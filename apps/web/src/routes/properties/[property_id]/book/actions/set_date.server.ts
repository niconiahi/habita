import * as v from "valibot"
import { get_date } from "$lib/date"
import { ForceDateSchema } from "$lib/server/force_date"
import { normalize_input } from "$lib/server/form"

const InputSchema = v.object({
  date: ForceDateSchema,
})

export async function set_date(
  url: URL,
  form_data: FormData,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        set_date: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  url.searchParams.set("date", get_date(input.date))
  return [null, { redirect_to: url.toString() }] as const
}
