import { useState } from "react"
import { Form, Link, useActionData } from "react-router"
import * as v from "valibot"
import { LocationInput } from "~/components/location_input"
import { require_auth } from "~/lib/server/auth"
import { error } from "~/lib/server/error"
import { ForceNumberSchema } from "~/lib/server/force_number"
import { has_edit_access } from "~/lib/server/property_access"
import {
  display_room_type,
  ROOM_TYPE,
} from "~/lib/room_type"
import {
  fetch_property,
  type Property,
} from "../../fetchers/server/property"
import type { Route } from "./+types/_index"
import {
  get_service_label,
  SERVICE_TYPE,
} from "~/lib/service"
import * as actions from "./actions/server"
import {
  CONTRACT_STATE,
  ContractStateSchema,
  get_contract_state_label,
} from "~/lib/server/contract_state"
import { format_date_for_input } from "~/lib/date"

const INTENT = {
  UPDATE_LOCATION: "update_location",
  CREATE_ROOM: "create_room",
  UPDATE_ROOM: "update_room",
  DESTROY_ROOM: "destroy_room",
  CREATE_SERVICE: "create_service",
  UPDATE_SERVICE: "update_service",
  DESTROY_SERVICE: "destroy_service",
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
  switch (intent) {
    case INTENT.UPDATE_ROOM: {
      actions.update_room(form_data)
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
    <main>
      <h1>propiedad</h1>
      <Location property={property} />
      <Rooms property={property} />
      <Services property={property} />
      <Contracts property={property} />
    </main>
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
                            {get_service_label(type)}
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
                <button
                  type="submit"
                  name="intent"
                  value={INTENT.UPDATE_SERVICE}
                >
                  guardar servicio
                </button>
                <input type="hidden" />
                <button
                  type="submit"
                  name="intent"
                  value={INTENT.DESTROY_SERVICE}
                >
                  eliminar servicio
                </button>
              </Form>
            </li>
          )
        })}
      </ul>
      {action_data?.error && (
        <p style={{ color: "red" }}>{action_data.error}</p>
      )}
      <Form method="POST">
        <button
          type="submit"
          name="intent"
          value={INTENT.CREATE_SERVICE}
        >
          agregar servicio
        </button>
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
        <button disabled={disabled} type="submit">
          actualizar ubicacion
        </button>
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

function Rooms({ property }: { property: Property }) {
  return (
    <section>
      <h2>habitaciones</h2>
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
                <button
                  type="submit"
                  name="intent"
                  value={INTENT.UPDATE_ROOM}
                >
                  guardar habitacion
                </button>
                <input type="hidden" />
                <button
                  type="submit"
                  name="intent"
                  value={INTENT.DESTROY_ROOM}
                >
                  eliminar habitacion
                </button>
              </Form>
            </li>
          )
        })}
      </ul>
      <Form method="POST">
        <button
          type="submit"
          name="intent"
          value={INTENT.CREATE_ROOM}
        >
          agregar habitacion
        </button>
      </Form>
    </section>
  )
}

function Contracts({ property }: { property: Property }) {
  const has_inactive_contract = property.contracts.some(
    (contract) => {
      return contract.state === CONTRACT_STATE.INACTIVE
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
              {contract.state ===
              CONTRACT_STATE.INACTIVE ? (
                <>
                  <span style={{ fontWeight: "bold" }}>
                    precio inicial
                  </span>
                  <span>${contract.initial_price}</span>
                  <Link
                    to={`/properties/${property.id}/contracts/${contract.id}/edit`}
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
