import * as v from "valibot"
import { ContractStateSchema } from "$lib/contract_state"
import { ForceNumberSchema } from "$lib/force_number"
import {
  get_errors,
  normalize_input,
} from "$lib/server/form"

export const InputSchema = v.object({
  state: v.optional(
    v.pipe(ForceNumberSchema, ContractStateSchema),
  ),
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
  return { redirect_to: url.pathname + url.search }
}

export const set_state = {
  execute,
  get_errors: (error: v.ValiError<typeof InputSchema>) => {
    return get_errors<typeof InputSchema>(error)
  },
}
