import { useRef, useState } from "react"
import { Form, useActionData } from "react-router"
import * as v from "valibot"
import { Button } from "~/components/button"
import { Formulary } from "~/components/formulary"
import { LocationInput } from "~/components/location_input"
import { RoomMap } from "~/components/room_map"
import {
  display_room_type,
  ROOM_TYPE,
} from "~/lib/room_type"
import { require_auth } from "~/lib/auth.server"
import { error } from "~/lib/error.server"
import { ForceNumberSchema } from "~/lib/force_number"
import {
  get_service_type_label,
  SERVICE_TYPE,
} from "~/lib/service"
import {
  fetch_property,
  type Property,
} from "~/routes/properties+/fetchers/property.server"
import type { Route } from "./+types/_index"
import * as actions from "./actions/index.server"
import {
  ACCESS_TYPE,
  get_access_type_label,
} from "~/lib/access_type"
import { has_edit_access } from "~/lib/property_access.server"
import {
  get_property_destinies,
  get_property_destiny_label,
} from "~/lib/property_destiny"

const INTENT = {
  UPDATE_LOCATION: "update_location",
  CREATE_ROOM: "create_room",
  UPDATE_ROOM: "update_room",
  UPDATE_ROOM_POSITIONS: "update_room_positions",
  DESTROY_ROOM: "destroy_room",
  CREATE_SERVICE: "create_service",
  UPDATE_SERVICE: "update_service",
  DESTROY_SERVICE: "destroy_service",
  CREATE_PROPERTY_FILE: "create_property_file",
  INVITE_OWNER: "invite_owner",
  UPDATE_DESTINIES: "update_destinies",
} as const

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
    {
      message: "property id should be a number",
    },
  )
  form_data.set("property_id", String(property_id))
  switch (intent) {
    case INTENT.UPDATE_ROOM: {
      actions.update_room(form_data)
      return null
    }
    case INTENT.UPDATE_ROOM_POSITIONS: {
      await actions.update_room_positions(form_data)
      return null
    }
    case INTENT.DESTROY_ROOM: {
      actions.destroy_room(form_data)
      return null
    }
    case INTENT.CREATE_ROOM: {
      actions.create_room(property_id)
      return null
    }
    case INTENT.UPDATE_LOCATION: {
      actions.update_location(form_data)
      return null
    }
    case INTENT.CREATE_SERVICE: {
      actions.create_service(property_id)
      return null
    }
    case INTENT.UPDATE_SERVICE: {
      try {
        await actions.update_service(form_data, property_id)
        return null
      } catch {
        return {
          error:
            "Sólo puede haber un servicio de cada tipo",
        }
      }
    }
    case INTENT.DESTROY_SERVICE: {
      actions.destroy_service(form_data)
      return null
    }
    case INTENT.CREATE_PROPERTY_FILE: {
      actions.create_property_file(form_data, property_id)
      return null
    }
    case INTENT.INVITE_OWNER: {
      actions.invite_owner(form_data)
      return null
    }
    case INTENT.UPDATE_DESTINIES: {
      await actions.update_destinies(form_data, property_id)
      return null
    }
  }
  return null
}

export async function loader({
  request,
  params,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  if (!has_edit_access(user.accesses)) {
    throw error(400, "not found")
  }
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
    {
      message: "property id should be a number",
    },
  )
  const property = await fetch_property(property_id)
  if (!property) {
    throw new Error(
      `property does not exist for id ${property_id}`,
    )
  }
  return { property }
}

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const { property } = loaderData
  return (
    <Formulary.Root label="Edición de propiedad">
      <Location property={property} />
      <Destinies property={property} />
      <Rooms property={property} />
      <RoomMapSection property={property} />
      <Members property={property} />
      <Photos property={property} />
      <Services property={property} />
    </Formulary.Root>
  )
}

function Photos({ property }: { property: Property }) {
  const action_data = useActionData<{ error?: string }>()
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
        <Formulary.Title>Fotos</Formulary.Title>
        <Formulary.Actions>
          <Button type="button" onClick={handle_add_click}>
            Agregar foto
          </Button>
        </Formulary.Actions>
      </Formulary.Header>
      <ul className="!grid grid-cols-1 min-[800px]:grid-cols-2 min-[1200px]:grid-cols-3 gap-4 list-none p-0 m-0">
        {property.images.map((image) => {
          const id = `image_${image.id}`
          return (
            <li key={id}>
              <img
                className="w-full aspect-video object-cover block"
                alt="Foto de la propiedad"
                src={`data:image/webp;base64,${image.content}`}
              />
            </li>
          )
        })}
      </ul>
      {action_data?.error && (
        <p className="text-red-500">{action_data.error}</p>
      )}
      <Form
        ref={form_ref}
        method="POST"
        encType="multipart/form-data"
        className="!contents"
      >
        <input
          ref={file_input_ref}
          type="file"
          name="file"
          className="sr-only"
          onChange={handle_file_change}
        />
        <input
          type="hidden"
          name="intent"
          value={INTENT.CREATE_PROPERTY_FILE}
        />
      </Form>
    </Formulary.Section>
  )
}

function Members({ property }: { property: Property }) {
  const has_owner = property.members.some((member) => {
    return member.type === ACCESS_TYPE.OWNER
  })
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>miembros</Formulary.Title>
      </Formulary.Header>
      <ul className="flex flex-col gap-4 list-none p-0 m-0">
        {property.members.map((member, index) => {
          const id = `member-${member.id}-${index}`
          return (
            <li className="flex gap-4" key={id}>
              <input
                type="hidden"
                value={member.id}
                name="id"
              />
              <p>
                {member.name} {member.surname}
              </p>
              <p>{get_access_type_label(member.type)}</p>
            </li>
          )
        })}
      </ul>
      {!has_owner ? (
        <Form method="POST">
          <Formulary.Field>
            <Formulary.Label htmlFor="email">
              email
            </Formulary.Label>
            <Formulary.Input
              id="email"
              name="email"
              type="email"
            />
          </Formulary.Field>
          <Button
            type="submit"
            name="intent"
            value={INTENT.INVITE_OWNER}
          >
            invitar dueño
          </Button>
        </Form>
      ) : null}
    </Formulary.Section>
  )
}

function Services({ property }: { property: Property }) {
  const action_data = useActionData<{ error?: string }>()
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>servicios</Formulary.Title>
        <Formulary.Actions>
          <Form method="POST">
            <Button
              type="submit"
              name="intent"
              value={INTENT.CREATE_SERVICE}
            >
              Agregar servicio
            </Button>
          </Form>
        </Formulary.Actions>
      </Formulary.Header>
      <ul className="flex flex-col gap-4 list-none p-0 m-0">
        {property.services.map((service) => {
          const id = `service_${service.id}`
          return (
            <li key={id}>
              <Form method="POST">
                <input
                  type="hidden"
                  value={service.id}
                  name="id"
                />
                <Formulary.Field>
                  <Formulary.Label
                    htmlFor={`type_${service.id}`}
                  >
                    Tipo
                  </Formulary.Label>
                  <Formulary.Select
                    name="type"
                    id={`type_${service.id}`}
                    defaultValue={service.type}
                  >
                    {Object.values(SERVICE_TYPE).map(
                      (type) => {
                        const option_id = `service_type_${type}`
                        return (
                          <option
                            key={option_id}
                            value={type}
                          >
                            {get_service_type_label(type)}
                          </option>
                        )
                      },
                    )}
                  </Formulary.Select>
                </Formulary.Field>
                <Formulary.Field>
                  <Formulary.Label
                    htmlFor={`code_${service.id}`}
                  >
                    Identificador
                  </Formulary.Label>
                  <Formulary.Input
                    id={`code_${service.id}`}
                    type="number"
                    name="code"
                    defaultValue={service.code}
                  />
                </Formulary.Field>
                <Formulary.Actions>
                  <Button
                    type="submit"
                    name="intent"
                    value={INTENT.UPDATE_SERVICE}
                  >
                    Guardar servicio
                  </Button>
                  <Button
                    type="submit"
                    name="intent"
                    value={INTENT.DESTROY_SERVICE}
                  >
                    Eliminar servicio
                  </Button>
                </Formulary.Actions>
              </Form>
            </li>
          )
        })}
      </ul>
      {action_data?.error && (
        <p className="text-red-500">{action_data.error}</p>
      )}
    </Formulary.Section>
  )
}

function Location({ property }: { property: Property }) {
  const [disabled, set_disabled] = useState(true)
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>ubicación</Formulary.Title>
      </Formulary.Header>
      <Form method="POST">
        <input
          type="hidden"
          value={INTENT.UPDATE_LOCATION}
          name="intent"
        />
        <input
          type="hidden"
          value={property.location.id}
          name="id"
        />
        <LocationInput
          default_value={property.location.address}
          default_lon={property.location.longitude}
          default_lat={property.location.latitude}
          on_selection={() => {
            set_disabled(false)
          }}
          on_clear={() => {
            set_disabled(true)
          }}
        />
        <Button disabled={disabled} type="submit">
          Guardar ubicación
        </Button>
      </Form>
    </Formulary.Section>
  )
}

function Destinies({ property }: { property: Property }) {
  const property_destinies = get_property_destinies()
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>Destino</Formulary.Title>
      </Formulary.Header>
      <Form method="POST">
        <Formulary.Label>Tipos</Formulary.Label>
        <fieldset>
          {property_destinies.map((destiny) => {
            const is_checked =
              property.destinies.includes(destiny)
            return (
              <Formulary.Checkbox
                key={destiny}
                name="destiny"
                value={destiny}
                defaultChecked={is_checked}
              >
                {get_property_destiny_label(destiny)}
              </Formulary.Checkbox>
            )
          })}
        </fieldset>
        <Formulary.Actions>
          <Button
            type="submit"
            name="intent"
            value={INTENT.UPDATE_DESTINIES}
          >
            Guardar destino
          </Button>
        </Formulary.Actions>
      </Form>
    </Formulary.Section>
  )
}

function Rooms({ property }: { property: Property }) {
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>ambientes</Formulary.Title>
        <Formulary.Actions>
          <Form method="POST">
            <Button
              type="submit"
              name="intent"
              value={INTENT.CREATE_ROOM}
            >
              Agregar ambiente
            </Button>
          </Form>
        </Formulary.Actions>
      </Formulary.Header>
      <ul>
        {property.rooms.map((room) => {
          const id = `room-${room.id}`
          return (
            <li key={id}>
              <Form method="POST">
                <input
                  type="hidden"
                  value={room.id}
                  name="id"
                />
                <Formulary.Field>
                  <Formulary.Label
                    htmlFor={`type_${room.id}`}
                  >
                    Tipo
                  </Formulary.Label>
                  <Formulary.Select
                    name="type"
                    id={`type_${room.id}`}
                    defaultValue={room.type}
                  >
                    {Object.values(ROOM_TYPE).map(
                      (type) => {
                        const option_id = `room_type_${type}`
                        return (
                          <option
                            key={option_id}
                            value={type}
                          >
                            {display_room_type(type)}
                          </option>
                        )
                      },
                    )}
                  </Formulary.Select>
                </Formulary.Field>
                <Formulary.Field>
                  <Formulary.Label
                    htmlFor={`length_${room.id}`}
                  >
                    Largo
                  </Formulary.Label>
                  <Formulary.Input
                    id={`length_${room.id}`}
                    type="number"
                    name="length"
                    step={0.1}
                    defaultValue={room.length}
                  />
                </Formulary.Field>
                <Formulary.Field>
                  <Formulary.Label
                    htmlFor={`width_${room.id}`}
                  >
                    Ancho
                  </Formulary.Label>
                  <Formulary.Input
                    id={`width_${room.id}`}
                    type="number"
                    name="width"
                    defaultValue={room.width}
                  />
                </Formulary.Field>
                <Formulary.Actions>
                  <Button
                    type="submit"
                    name="intent"
                    value={INTENT.UPDATE_ROOM}
                  >
                    Guardar ambiente
                  </Button>
                  <Button
                    type="submit"
                    name="intent"
                    value={INTENT.DESTROY_ROOM}
                  >
                    Eliminar ambiente
                  </Button>
                </Formulary.Actions>
              </Form>
            </li>
          )
        })}
      </ul>
    </Formulary.Section>
  )
}
function RoomMapSection({
  property,
}: {
  property: Property
}) {
  const [room_positions, set_room_positions] = useState<
    Map<number, { x: number; y: number }>
  >(new Map())
  return (
    <Formulary.Section>
      <Formulary.Header>
        <Formulary.Title>mapa</Formulary.Title>
      </Formulary.Header>
      <RoomMap
        rooms={property.rooms}
        on_positions_change={set_room_positions}
      />
      <Form method="POST">
        <input
          type="hidden"
          name="positions"
          value={JSON.stringify(
            Array.from(room_positions.entries()).map(
              ([room_id, pos]) => ({
                room_id,
                position_x: pos.x,
                position_y: pos.y,
              }),
            ),
          )}
        />
        <Formulary.Actions>
          <Button
            type="submit"
            name="intent"
            value={INTENT.UPDATE_ROOM_POSITIONS}
            disabled={room_positions.size === 0}
          >
            Guardar mapa
          </Button>
        </Formulary.Actions>
      </Form>
    </Formulary.Section>
  )
}
