import { require_auth } from "~/lib/server/auth"
import type { Route } from "./+types/_index"
import { get_access_type_label } from "~/lib/server/access_type"
import { query_builder } from "db/query_builder"
import { jsonObjectFrom } from "kysely/helpers/postgres"
import { Form, Link } from "react-router"
import { has_edit_access } from "~/lib/server/property_access"
import { error } from "~/lib/server/error"
import * as actions from "./actions/server"
import {
  get_user_file_type_label,
  USER_FILE_TYPE,
} from "~/lib/server/user_file_type"

const INTENT = {
  CREATE_FILE: "create_file",
  DESTROY_FILE: "destroy_file",
} as const

export async function action({
  request,
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
  switch (intent) {
    case INTENT.CREATE_FILE: {
      actions.create_file(form_data)
      return null
    }
  }
  return null
}

export async function loader({
  request,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  const property_ids = user.accesses.map((access) => {
    return access.property_id
  })
  const properties = await fetch_properties(property_ids)
  const user_files = await fetch_user_files(user.id)
  return { user, properties, user_files }
}

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const { user, properties, user_files } = loaderData
  return (
    <main>
      <h1>Perfil</h1>
      <section>
        <h3>accesos</h3>
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
      </section>
      <section>
        <h3>documentos</h3>
        <ul>
          {user_files.map((file) => {
            const id = `file_${file.basename}`
            return <li key={id}>{file.basename}</li>
          })}
        </ul>
        <Form
          method="POST"
          encType="multipart/form-data"
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0.25rem",
            border: "1px solid green",
          }}
        >
          <p>
            <label htmlFor="type">tipo</label>
            <select name="type" id="type">
              {Object.values(USER_FILE_TYPE).map((type) => {
                const id = `user_file_type_${type}`
                return (
                  <option key={id} value={type}>
                    {get_user_file_type_label(type)}
                  </option>
                )
              })}
            </select>
          </p>
          <p>
            <label htmlFor="file">documento</label>
            <input type="file" id="file" name="file" />
          </p>
          <button
            type="submit"
            name="intent"
            value={INTENT.CREATE_FILE}
          >
            agregar documento
          </button>
        </Form>
      </section>
    </main>
  )
}

async function fetch_user_files(user_id: number) {
  return query_builder
    .selectFrom("user_file")
    .innerJoin("user", "user.id", "user_file.user_id")
    .innerJoin("file", "file.id", "user_file.file_id")
    .where("user.id", "=", user_id)
    .select(["file.basename"])
    .execute()
}
type UserFile = Awaited<
  ReturnType<typeof fetch_user_files>
>[0]

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
