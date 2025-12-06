import { Form, redirect } from "react-router"
import * as v from "valibot"
import { Button } from "~/components/button"
import { Formulary } from "~/components/formulary"
import { require_auth } from "~/lib/auth.server"
import { error } from "~/lib/error.server"
import { ForceNumberSchema } from "~/lib/force_number"
import { has_edit_access } from "~/lib/property_access.server"
import {
  CONTRACT_TYPE,
  get_contract_type_label,
  type ContractType,
} from "~/lib/contract_type"
import { get_contract_types } from "~/lib/contract_type"
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
    <Formulary.Root label="Creación de contrato">
      <Form method="POST">
        <TypeSection contract_types={contract_types} />
        <PriceSection />
        <Formulary.Actions>
          <Button
            type="submit"
            name="intent"
            value={INTENT.CREATE_CONTRACT}
          >
            Crear contrato
          </Button>
        </Formulary.Actions>
      </Form>
    </Formulary.Root>
  )
}
function TypeSection({
  contract_types,
}: {
  contract_types: ContractType[]
}) {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>tipo</Formulary.Title>
      </Formulary.Header>
      <Formulary.Field>
        <Formulary.Label htmlFor="type">
          Tipo de contrato
        </Formulary.Label>
        <Formulary.Select
          id="type"
          name="type"
          required
          defaultValue={CONTRACT_TYPE.LONG_TERM}
        >
          {contract_types.map((type) => (
            <option key={type} value={type}>
              {get_contract_type_label(type)}
            </option>
          ))}
        </Formulary.Select>
      </Formulary.Field>
    </Formulary.Section>
  )
}
function PriceSection() {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>precio</Formulary.Title>
      </Formulary.Header>
      <Formulary.Field>
        <Formulary.Label htmlFor="price">
          Precio inicial
        </Formulary.Label>
        <Formulary.Input
          id="price"
          name="price"
          type="number"
          required
        />
      </Formulary.Field>
    </Formulary.Section>
  )
}
