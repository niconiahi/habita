import { Form, redirect } from "react-router"
import * as v from "valibot"
import { require_auth } from "~/lib/auth.server"
import { error } from "~/lib/error.server"
import { ForceNumberSchema } from "~/lib/force_number.server"
import { has_edit_access } from "~/lib/property_access.server"
import {
  ContractType,
  get_contract_types,
  get_contract_type_label,
} from "~/lib/contract_type.server"
import type { Route } from "./+types/_index"
import * as actions from "./actions/index.server"

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
  const contract_types = get_contract_types()
  return { contract_types }
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

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const { contract_types } = loaderData
  return (
    <main>
      <h1>nuevo contrato</h1>
      <Form method="POST">
        <p>
          <label htmlFor="type">tipo de contrato</label>
          <select
            id="type"
            name="type"
            required
            defaultValue={ContractType.LONG_TERM}
          >
            {contract_types.map((type) => (
              <option key={type} value={type}>
                {get_contract_type_label(type)}
              </option>
            ))}
          </select>
        </p>
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
