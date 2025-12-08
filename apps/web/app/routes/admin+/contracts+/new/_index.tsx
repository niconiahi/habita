import { Form, redirect } from "react-router"
import { Button } from "~/components/button"
import { Content } from "~/components/content"
import { Formulary } from "~/components/formulary"
import { require_auth } from "~/lib/auth.server"
import { ACCESS_TYPE } from "~/lib/access_type"
import { display_location } from "~/lib/display_location"
import {
  fetch_available_properties,
  type AvailableProperty,
} from "./fetchers/available_properties.server"
import type { Route } from "./+types/_index"

export async function loader({
  request,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  const admin_property_ids = user.accesses
    .filter(
      (access) =>
        access.type === ACCESS_TYPE.OWNER ||
        access.type === ACCESS_TYPE.ADMINISTRATOR,
    )
    .map((access) => access.property_id)
  const available_properties =
    await fetch_available_properties(admin_property_ids)
  return { available_properties }
}

export async function action({
  request,
}: Route.ActionArgs) {
  await require_auth(request)
  const form_data = await request.formData()
  const property_id = form_data.get("property_id")
  if (!property_id) {
    return { error: "Debes seleccionar una propiedad" }
  }
  return redirect(
    `/admin/properties/${property_id}/contracts/new`,
  )
}

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const { available_properties } = loaderData
  const has_available_properties =
    available_properties.length > 0
  if (!has_available_properties) {
    return (
      <p>
        No hay propiedades disponibles para crear un
        contrato.
      </p>
    )
  }
  return (
    <Content.Root label="Creación de contrato">
      <Content.Title>Creación de contrato</Content.Title>
      <PropertySection
        available_properties={available_properties}
      />
    </Content.Root>
  )
}
function PropertySection({
  available_properties,
}: {
  available_properties: AvailableProperty[]
}) {
  return (
    <Content.Section>
      <Formulary.Root method="POST">
        <Formulary.Field>
          <Formulary.Label htmlFor="property_id">
            Propiedad
          </Formulary.Label>
          <Formulary.Select
            id="property_id"
            name="property_id"
            required
          >
            <option value="">
              Selecciona una propiedad
            </option>
            {available_properties.map((property) => (
              <option key={property.id} value={property.id}>
                {display_location(property.location)}
                {property.unit ? ` - ${property.unit}` : ""}
              </option>
            ))}
          </Formulary.Select>
        </Formulary.Field>
        <Formulary.Actions>
          <Button type="submit">Continuar</Button>
        </Formulary.Actions>
      </Formulary.Root>
    </Content.Section>
  )
}
