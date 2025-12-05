import { useState } from "react"
import { Form, Link, useActionData } from "react-router"
import * as v from "valibot"
import { Button } from "~/components/button"
import { LocationInput } from "~/components/location_input"
import { RoomMap } from "~/components/room_map"
import { format_date_for_input } from "~/lib/date"
import {
  display_room_type,
  ROOM_TYPE,
} from "~/lib/room_type"
import { require_auth } from "~/lib/auth.server"
import {
  CONTRACT_STATE,
  ContractStateSchema,
  get_contract_state_label,
} from "~/lib/contract_state"
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
    <>
      <h1>Edición de propiedad</h1>
      <Location property={property} />
      <Destinies property={property} />
      <Rooms property={property} />
      <Members property={property} />
      <Photos property={property} />
      <Services property={property} />
      <Contracts property={property} />
    </>
  )
}

function Photos({ property }: { property: Property }) {
  const action_data = useActionData<{ error?: string }>()
  return (
    <section>
      <h2>fotos</h2>
      <ul
        style={{
          gap: "1rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {property.images.map((image) => {
          const id = `image_${image.id}`
          return (
            <img
              alt="someresr"
              key={id}
              src={`data:image/webp;base64,${image.content}`}
            />
          )
        })}
      </ul>
      {action_data?.error && (
        <p style={{ color: "red" }}>{action_data.error}</p>
      )}
      <Form method="POST" encType="multipart/form-data">
        <p>
          <label htmlFor="file">foto</label>
          <input type="file" id="file" name="file" />
        </p>
        <Button.Root
          type="submit"
          name="intent"
          value={INTENT.CREATE_PROPERTY_FILE}
        >
          agregar
        </Button.Root>
      </Form>
    </section>
  )
}

function Members({ property }: { property: Property }) {
  console.log("property.members", property.members)
  const has_owner = property.members.some((member) => {
    return member.type === ACCESS_TYPE.OWNER
  })
  return (
    <section>
      <h2>miembros</h2>
      <ul
        style={{
          gap: "1rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {property.members.map((member) => {
          const id = `member-${member.id}`
          return (
            <li key={id}>
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
          <input name="email" />
          <Button.Root
            type="submit"
            name="intent"
            value={INTENT.INVITE_OWNER}
          >
            invitar dueño
          </Button.Root>
        </Form>
      ) : null}
    </section>
  )
}

function Services({ property }: { property: Property }) {
  const action_data = useActionData<{ error?: string }>()
  return (
    <section>
      <h2>servicios</h2>
      <ul
        style={{
          gap: "1rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
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
                <p>
                  <label htmlFor="type">tipo</label>
                  <select
                    name="type"
                    id="type"
                    defaultValue={service.type}
                  >
                    {Object.values(SERVICE_TYPE).map(
                      (type) => {
                        const id = `service_type_${type}`
                        return (
                          <option key={id} value={type}>
                            {get_service_type_label(type)}
                          </option>
                        )
                      },
                    )}
                  </select>
                </p>
                <p>
                  <label htmlFor="code">code</label>
                  <input
                    id="code"
                    type="number"
                    name="code"
                    defaultValue={service.code}
                  />
                </p>
                <Button.Root
                  type="submit"
                  name="intent"
                  value={INTENT.UPDATE_SERVICE}
                >
                  guardar servicio
                </Button.Root>
                <input type="hidden" />
                <Button.Root
                  type="submit"
                  name="intent"
                  value={INTENT.DESTROY_SERVICE}
                >
                  eliminar servicio
                </Button.Root>
              </Form>
            </li>
          )
        })}
      </ul>
      {action_data?.error && (
        <p style={{ color: "red" }}>{action_data.error}</p>
      )}
      <Form method="POST">
        <Button.Root
          type="submit"
          name="intent"
          value={INTENT.CREATE_SERVICE}
        >
          agregar servicio
        </Button.Root>
      </Form>
    </section>
  )
}

function Location({ property }: { property: Property }) {
  const [disabled, set_disabled] = useState(true)
  return (
    <section>
      <h2>ubicacion</h2>
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
          on_selection={() => {
            set_disabled(false)
          }}
          on_clear={() => {
            set_disabled(true)
          }}
        />
        <Button.Root disabled={disabled} type="submit">
          actualizar ubicacion
        </Button.Root>
        <a
          href={`https://www.google.com/maps?q=${property.location.latitude},${property.location.longitude}`}
          target="_blank"
        >
          View on Google Maps
        </a>
      </Form>
    </section>
  )
}

function Destinies({ property }: { property: Property }) {
  const property_destinies = get_property_destinies()
  return (
    <section>
      <h2>destino</h2>
      <Form method="POST">
        <fieldset>
          {property_destinies.map((destiny) => {
            const id = `destiny_${destiny}`
            const is_checked =
              property.destinies.includes(destiny)
            return (
              <p key={id}>
                <input
                  type="checkbox"
                  id={id}
                  name="destiny"
                  value={destiny}
                  defaultChecked={is_checked}
                />
                <label htmlFor={id}>
                  {get_property_destiny_label(destiny)}
                </label>
              </p>
            )
          })}
        </fieldset>
        <Button.Root
          type="submit"
          name="intent"
          value={INTENT.UPDATE_DESTINIES}
        >
          guardar destino
        </Button.Root>
      </Form>
    </section>
  )
}

function Rooms({ property }: { property: Property }) {
  const [room_positions, set_room_positions] = useState<
    Map<number, { x: number; y: number }>
  >(new Map())
  return (
    <section>
      <h2>ambientes</h2>
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
        <Button.Root
          type="submit"
          name="intent"
          value={INTENT.UPDATE_ROOM_POSITIONS}
          disabled={room_positions.size === 0}
        >
          guardar mapa
        </Button.Root>
      </Form>
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
                <p>
                  <label htmlFor="type">tipo</label>
                  <select
                    name="type"
                    id="type"
                    defaultValue={room.type}
                  >
                    {Object.values(ROOM_TYPE).map(
                      (type) => {
                        const id = `room_type_${type}`
                        return (
                          <option key={id} value={type}>
                            {display_room_type(type)}
                          </option>
                        )
                      },
                    )}
                  </select>
                </p>
                <p>
                  <label htmlFor="length">length</label>
                  <input
                    id="length"
                    type="number"
                    name="length"
                    step={0.1}
                    defaultValue={room.length}
                  />
                </p>
                <p>
                  <label htmlFor="width">width</label>
                  <input
                    id="width"
                    type="number"
                    name="width"
                    defaultValue={room.width}
                  />
                </p>
                <Button.Root
                  type="submit"
                  name="intent"
                  value={INTENT.UPDATE_ROOM}
                >
                  guardar habitacion
                </Button.Root>
                <input type="hidden" />
                <Button.Root
                  type="submit"
                  name="intent"
                  value={INTENT.DESTROY_ROOM}
                >
                  eliminar habitacion
                </Button.Root>
              </Form>
            </li>
          )
        })}
      </ul>
      <Form method="POST">
        <Button.Root
          type="submit"
          name="intent"
          value={INTENT.CREATE_ROOM}
        >
          agregar habitacion
        </Button.Root>
      </Form>
    </section>
  )
}

function Contracts({ property }: { property: Property }) {
  const has_inactive_contract = property.contracts.some(
    (contract) => {
      return contract.state === CONTRACT_STATE.EDITING
    },
  )
  return (
    <section>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2>contratos</h2>
        {has_inactive_contract ? null : (
          <Link
            to={`/properties/${property.id}/contracts/new`}
          >
            crear contrato
          </Link>
        )}
      </header>
      <ul
        style={{
          gap: "1rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {property.contracts.map((contract) => {
          const id = `contract-${contract.id}`
          const contract_state = v.parse(
            ContractStateSchema,
            contract.state,
          )
          return (
            <li
              style={{
                display: "flex",
                gap: "1rem",
              }}
              key={id}
            >
              <span style={{ fontWeight: "bold" }}>
                estado
              </span>
              <span>
                {get_contract_state_label(contract_state)}
              </span>
              {contract.start_date ? (
                <>
                  <span style={{ fontWeight: "bold" }}>
                    inicio
                  </span>
                  <span>
                    {format_date_for_input(
                      contract.start_date,
                    ).slice(0, 10)}
                  </span>
                </>
              ) : null}
              {contract.end_date ? (
                <>
                  <span style={{ fontWeight: "bold" }}>
                    finalizacion
                  </span>
                  <span>
                    {format_date_for_input(
                      contract.end_date,
                    ).slice(0, 10)}
                  </span>
                </>
              ) : null}
              {contract.state === CONTRACT_STATE.EDITING ? (
                <>
                  <span style={{ fontWeight: "bold" }}>
                    precio inicial
                  </span>
                  <span>${contract.initial_price}</span>
                  <Link
                    to={`/admin/properties/${property.id}/contracts/${contract.id}/edit`}
                    reloadDocument
                  >
                    Edit
                  </Link>
                </>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
