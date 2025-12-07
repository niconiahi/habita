import { query_builder } from "db/query_builder"
import { jsonObjectFrom } from "kysely/helpers/postgres"
import { useRef } from "react"
import { Form, Link } from "react-router"
import { Button } from "~/components/button"
import { Formulary } from "~/components/formulary"
import { Table } from "~/components/table"
import { get_access_type_label } from "~/lib/access_type"
import { require_auth } from "~/lib/auth.server"
import { error } from "~/lib/error.server"
import { has_edit_access } from "~/lib/property_access.server"
import {
  get_user_file_type_label,
  USER_FILE_TYPE,
} from "~/lib/user_file_type"
import type { Route } from "./+types/_index"
import * as actions from "./actions/index.server"

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
    <main className="flex flex-col gap-8 p-4">
      <h1>Perfil</h1>
      <section>
        <h3>accesos</h3>
        <Table.Root>
          <Table.Header>
            <Table.Cell header>Rol</Table.Cell>
            <Table.Cell header>Propiedad</Table.Cell>
          </Table.Header>
          <Table.Body>
            {user.accesses.map((access) => {
              const id = `access_${access.id}`
              const property = get_property(
                properties,
                access.property_id,
              )
              return (
                <Table.Row key={id}>
                  <Table.Cell>
                    {get_access_type_label(access.type)}
                  </Table.Cell>
                  <Table.Cell>
                    <Link to={`/properties/${property.id}`}>
                      {property.location.road}{" "}
                      {property.location.house_number}
                    </Link>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Root>
      </section>
      <DocumentsSection user_files={user_files} />
    </main>
  )
}

type UserFile = Awaited<
  ReturnType<typeof fetch_user_files>
>[0]
function DocumentsSection({
  user_files,
}: {
  user_files: UserFile[]
}) {
  const file_input_ref = useRef<HTMLInputElement>(null)
  const form_ref = useRef<HTMLFormElement>(null)
  function handle_add_click() {
    file_input_ref.current?.click()
  }
  function handle_file_change() {
    form_ref.current?.requestSubmit()
  }
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>documentos</Formulary.Title>
        <Formulary.Actions>
          <Button type="button" onClick={handle_add_click}>
            agregar documento
          </Button>
        </Formulary.Actions>
      </Formulary.Header>
      <Form
        ref={form_ref}
        method="POST"
        encType="multipart/form-data"
      >
        <input
          ref={file_input_ref}
          type="file"
          name="file"
          className="sr-only"
          onChange={handle_file_change}
        />
        <Formulary.Field>
          <Formulary.Label htmlFor="type">
            tipo
          </Formulary.Label>
          <Formulary.Select name="type" id="type">
            {Object.values(USER_FILE_TYPE).map((type) => {
              const id = `user_file_type_${type}`
              return (
                <option key={id} value={type}>
                  {get_user_file_type_label(type)}
                </option>
              )
            })}
          </Formulary.Select>
        </Formulary.Field>
        <input
          type="hidden"
          name="intent"
          value={INTENT.CREATE_FILE}
        />
      </Form>
      <Table.Root>
        <Table.Header>
          <Table.Cell header>Documento</Table.Cell>
          <Table.Cell header>Tipo</Table.Cell>
          <Table.Cell header>Acciones</Table.Cell>
        </Table.Header>
        <Table.Body>
          {user_files.map((file) => {
            const id = `file_${file.id}`
            return (
              <Table.Row key={id}>
                <Table.Cell>{file.basename}</Table.Cell>
                <Table.Cell>
                  {get_user_file_type_label(file.type)}
                </Table.Cell>
                <Table.Cell>
                  <a
                    href={`/files/${file.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    descargar
                  </a>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table.Root>
    </Formulary.Section>
  )
}

async function fetch_user_files(user_id: number) {
  return query_builder
    .selectFrom("user_file")
    .innerJoin("user", "user.id", "user_file.user_id")
    .innerJoin("file", "file.id", "user_file.file_id")
    .where("user.id", "=", user_id)
    .select(["file.id", "file.basename", "user_file.type"])
    .execute()
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
