import { Form, redirect } from "react-router"
import * as v from "valibot"
import { require_auth } from "~/lib/server/auth"
import { error } from "~/lib/server/error"
import { ForceNumberSchema } from "~/lib/server/force_number"
import { has_edit_access } from "~/lib/server/property_access"
import type { Route } from "./+types/_index"
import * as actions from "./actions"

const INTENT = {
  CREATE_CONTRACT: "create_contract",
} as const

export async function loader({
  request,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  if (!has_edit_access(user.accesses)) {
    throw error(400, "not found")
  }
  return {}
}

export async function action({
  request,
  params,
}: Route.ActionArgs) {
  const { user } = await require_auth(request)
  if (!has_edit_access(user.accesses)) {
    throw error(400, "not found")
  }
  const form_data = await request.formData()
  const intent = form_data.get("intent")
  if (!intent) {
    throw error(400, "intent is required")
  }
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )
  switch (intent) {
    case INTENT.CREATE_CONTRACT: {
      const { redirect_to } = await actions.create_contract(
        form_data,
        property_id,
      )
      return redirect(redirect_to)
    }
  }
}

export default function () {
  return (
    <main>
      <h1>nuevo contrato</h1>
      <Form method="POST">
        <p>
          <label htmlFor="price">precio inicial</label>
          <input
            id="price"
            name="price"
            type="number"
            required
          />
        </p>
        <button
          type="submit"
          name="intent"
          value={INTENT.CREATE_CONTRACT}
        >
          crear contrato
        </button>
      </Form>
    </main>
  )
}
