import { useState } from "react"
import { redirect } from "react-router"
import { Button } from "~/components/button"
import { Content } from "~/components/content"
import { Formulary } from "~/components/formulary"
import { LocationInput } from "~/components/location_input"
import { Section } from "~/components/section"
import { require_auth } from "~/lib/auth.server"
import { error } from "~/lib/error.server"
import { has_edit_access } from "~/lib/property_access.server"
import {
  get_property_destinies,
  get_property_destiny_label,
} from "~/lib/property_destiny"
import {
  get_property_type_label,
  get_property_types,
  PROPERTY_TYPE,
  type PropertyType,
} from "~/lib/property_type"
import * as actions from "~/routes/properties+/actions/index.server"
import type { Route } from "./+types/new"

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
    <Content.Root>
      <Content.Title>Creación de propiedad</Content.Title>
      <Content.Section>
        <Formulary.Root method="POST">
          <Formulary.Fields>
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
          </Formulary.Fields>
          <Formulary.Actions>
            <Button disabled={disabled} type="submit">
              Crear propiedad
            </Button>
          </Formulary.Actions>
        </Formulary.Root>
      </Content.Section>
    </Content.Root>
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
    <Content.Section>
      <Section.Header>
        <Section.Title>ubicación</Section.Title>
      </Section.Header>
      <LocationInput
        on_selection={on_selection}
        on_clear={on_clear}
      />
    </Content.Section>
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
    <Content.Section>
      <Section.Header>
        <Section.Title>características</Section.Title>
      </Section.Header>
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
    </Content.Section>
  )
}
function DestinySection({
  property_destinies,
}: {
  property_destinies: number[]
}) {
  return (
    <Content.Section>
      <Section.Header>
        <Section.Title>destino</Section.Title>
      </Section.Header>
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
    </Content.Section>
  )
}
