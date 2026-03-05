import * as v from "valibot"
import { ContractStateSchema } from "$lib/contract_state"
import { ForceNumberSchema } from "$lib/force_number"
import { normalize_input } from "$lib/server/form"

const InputSchema = v.object({
  state: v.optional(
    v.pipe(ForceNumberSchema, ContractStateSchema),
  ),
})

export async function set_state(
  request: Request,
  form_data: FormData,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        set_state: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const url = new URL(request.url)
  for (const key of url.searchParams.keys()) {
    if (key.startsWith("/")) {
      url.searchParams.delete(key)
    }
  }
  if (input.state === undefined) {
    url.searchParams.delete("state")
  } else {
    url.searchParams.set("state", String(input.state))
  }

  return [
    null,
    { redirect_to: url.pathname + url.search },
  ] as const
}
