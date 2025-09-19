import { require_auth } from "~/lib/server/auth"
import type { Route } from "./+types/profile"
import { get_access_type_label } from "~/lib/server/access_type"
import { query_builder } from "db/query_builder"
import { jsonObjectFrom } from "kysely/helpers/postgres"
import { Link } from "react-router"

export async function loader({
  request,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  const property_ids = user.accesses.map((access) => {
    return access.property_id
  })
  const properties = await fetch_properties(property_ids)
  return { user, properties }
}

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const { user, properties } = loaderData
  return (
    <main>
      <h1>Perfil</h1>
      <ul>
        {user.accesses.map((access) => {
          const id = `access_${access.id}`
          const property = get_property(
            properties,
            access.property_id,
          )
          return (
            <li key={id}>
              {get_access_type_label(access.id)} de la
              propiedad en{" "}
              <Link to={`/properties/${property.id}`}>
                {property.location.road}{" "}
                {property.location.house_number}
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

async function fetch_properties(property_ids: number[]) {
  return query_builder
    .selectFrom("property")
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .where("property.id", "in", property_ids)
    .select((eb) => [
      "property.id",
      jsonObjectFrom(
        eb
          .selectFrom("location")
          .select([
            "location.address",
            "location.id",
            "location.latitude",
            "location.longitude",
            "location.road",
            "location.house_number",
            "location.state",
            "location.suburb",
            "location.city",
            "location.town",
          ])
          .whereRef(
            "location.id",
            "=",
            "property.location_id",
          ),
      )
        .$notNull()
        .as("location"),
    ])
    .execute()
}
type Property = Awaited<
  ReturnType<typeof fetch_properties>
>[0]

function get_property(properties: Property[], id: number) {
  const property = properties.find((property) => {
    return property.id === id
  })
  if (!property) {
    throw new Error("property should exist")
  }
  return property
}
