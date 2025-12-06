import { useState } from "react"
import { Form, redirect } from "react-router"
import { Button } from "~/components/button"
import { Formulary } from "~/components/formulary"
import { LocationInput } from "~/components/location_input"
import { require_auth } from "~/lib/auth.server"
import { error } from "~/lib/error.server"
import { has_edit_access } from "~/lib/property_access.server"
import type { Route } from "./+types/new"
import {
  get_property_type_label,
  PROPERTY_TYPE,
  type PropertyType,
} from "~/lib/property_type"
import { get_property_types } from "~/lib/property_type"
import {
  get_property_destinies,
  get_property_destiny_label,
} from "~/lib/property_destiny"
import * as actions from "~/routes/properties+/actions/index.server"

const INTENT = {
  CREATE_PROPERTY: "create_property",
} as const

export async function loader({
  request,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  if (!has_edit_access(user.accesses)) {
    throw error(400, "not found")
  }
  return {
    property_types: get_property_types(),
    property_destinies: get_property_destinies(),
  }
}

export async function action({
  request,
}: Route.ActionArgs) {
  const { user } = await require_auth(request)
  if (!has_edit_access(user.accesses)) {
    throw error(400, "not found")
  }
  const form_data = await request.formData()
  form_data.set("user_id", String(user.id))
  const intent = form_data.get("intent")
  if (!intent) {
    throw error(400, "intent is required")
  }
  switch (intent) {
    case INTENT.CREATE_PROPERTY: {
      const { redirect_to } =
        await actions.create_property(form_data)
      return redirect(redirect_to)
    }
  }
}

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const { property_types, property_destinies } = loaderData
  const [disabled, set_disabled] = useState(true)
  const [property_type, set_property_type] =
    useState<PropertyType>(PROPERTY_TYPE.DEPARTMENT)
  return (
    <Formulary.Root label="Creación de propiedad">
      <Form method="POST">
        <input
          type="hidden"
          value={INTENT.CREATE_PROPERTY}
          name="intent"
        />
        <LocationSection
          on_selection={() => set_disabled(false)}
          on_clear={() => set_disabled(true)}
        />
        <CharacteristicsSection
          property_types={property_types}
          property_type={property_type}
          on_type_change={set_property_type}
        />
        <DestinySection
          property_destinies={property_destinies}
        />
        <Button disabled={disabled} type="submit">
          Crear propiedad
        </Button>
      </Form>
    </Formulary.Root>
  )
}
function LocationSection({
  on_selection,
  on_clear,
}: {
  on_selection: () => void
  on_clear: () => void
}) {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>ubicación</Formulary.Title>
      </Formulary.Header>
      <LocationInput
        on_selection={on_selection}
        on_clear={on_clear}
      />
    </Formulary.Section>
  )
}
function CharacteristicsSection({
  property_types,
  property_type,
  on_type_change,
}: {
  property_types: PropertyType[]
  property_type: PropertyType
  on_type_change: (type: PropertyType) => void
}) {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>características</Formulary.Title>
      </Formulary.Header>
      <Formulary.Field>
        <Formulary.Label htmlFor="type">
          Tipo
        </Formulary.Label>
        <Formulary.Select
          name="type"
          id="type"
          required
          onChange={(event) => {
            const property_type = Number(
              event.target.value,
            ) as PropertyType
            on_type_change(property_type)
          }}
        >
          {property_types.map((type) => {
            const id = `property_type_${type}`
            return (
              <option key={id} value={type}>
                {get_property_type_label(type)}
              </option>
            )
          })}
        </Formulary.Select>
      </Formulary.Field>
      {property_type === PROPERTY_TYPE.DEPARTMENT ? (
        <Formulary.Field>
          <Formulary.Label htmlFor="unit">
            Unidad
          </Formulary.Label>
          <Formulary.Input
            placeholder="ej. 9A o 4011"
            required
            name="unit"
            id="unit"
            type="text"
          />
        </Formulary.Field>
      ) : null}
    </Formulary.Section>
  )
}
function DestinySection({
  property_destinies,
}: {
  property_destinies: number[]
}) {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>destino</Formulary.Title>
      </Formulary.Header>
      <fieldset>
        {property_destinies.map((destiny) => (
          <Formulary.Checkbox
            key={destiny}
            name="destiny"
            value={destiny}
          >
            {get_property_destiny_label(destiny)}
          </Formulary.Checkbox>
        ))}
      </fieldset>
    </Formulary.Section>
  )
}
