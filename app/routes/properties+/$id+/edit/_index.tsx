import { useState } from "react"
import { Form, Link, useActionData } from "react-router"
import * as v from "valibot"
import { LocationInput } from "~/components/location_input"
import { require_auth } from "~/lib/server/auth"
import { ContractState } from "~/lib/server/contract_state"
import {
  DURATIONS,
  get_duration_label,
} from "~/lib/server/duration"
import { error } from "~/lib/server/error"
import { ForceNumberSchema } from "~/lib/server/force_number"
import {
  ESCALATION_TYPE,
  get_escalation_label,
} from "~/lib/server/escalation_type"
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
  ContractTypeSchema,
  get_contract_type_label,
} from "~/lib/server/contract_file_type"

const INTENT = {
  UPDATE_LOCATION: "update_location",
  CREATE_ROOM: "create_room",
  UPDATE_ROOM: "update_room",
  DESTROY_ROOM: "destroy_room",
  CREATE_CONTRACT: "create_contract",
  UPDATE_CONTRACT: "update_contract",
  DESTROY_CONTRACT: "destroy_contract",
  CREATE_FILE: "create_file",
  DESTROY_FILE: "destroy_file",
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
    params.id,
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
    case INTENT.UPDATE_CONTRACT: {
      actions.update_contract(form_data, property_id)
      return null
    }
    case INTENT.DESTROY_CONTRACT: {
      actions.destroy_contract(form_data)
      return null
    }
    case INTENT.CREATE_FILE: {
      actions.create_file(form_data)
      return null
    }
    case INTENT.DESTROY_FILE: {
      actions.destroy_file(form_data)
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
  const id = v.parse(ForceNumberSchema, params.id, {
    message: "property id should be a number",
  })
  const property = await fetch_property(id)
  if (!property) {
    throw new Error(`property does not exist for id ${id}`)
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
        <Link
          to={`/properties/${property.id}/contracts/new`}
        >
          crear contrato
        </Link>
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
          return (
            <li
              style={{
                display: "flex",
                padding: "0.5rem",
                border: "2px solid black",
              }}
              key={id}
            >
              <Form method="POST">
                <input
                  type="hidden"
                  value={contract.id}
                  name="id"
                />
                <p>
                  <label htmlFor="start_date">
                    fecha de inicio
                  </label>
                  <input
                    id="start_date"
                    name="start_date"
                    type="datetime-local"
                    readOnly={
                      contract.state !==
                      ContractState.INACTIVE
                    }
                    defaultValue={
                      contract.start_date
                        ? format_date_for_input(
                            contract.start_date,
                          )
                        : undefined
                    }
                  />
                </p>
                <p>
                  <label htmlFor="end_date">
                    fecha de finalizacion
                  </label>
                  <input
                    id="end_date"
                    type="datetime-local"
                    name="end_date"
                    readOnly={
                      contract.state !==
                      ContractState.INACTIVE
                    }
                    defaultValue={
                      contract.end_date
                        ? format_date_for_input(
                            contract.end_date,
                          )
                        : undefined
                    }
                  />
                </p>
                <p>
                  <label htmlFor="duration">
                    frecuencia
                  </label>
                  <select
                    name="duration"
                    id="duration"
                    defaultValue={
                      contract.duration ?? undefined
                    }
                  >
                    {DURATIONS.map((duration) => {
                      const id = `duration_${duration}`
                      return (
                        <option key={id} value={duration}>
                          {get_duration_label(duration)}
                        </option>
                      )
                    })}
                  </select>
                </p>
                <p>
                  <label htmlFor="formula">formula</label>
                  <select
                    name="formula"
                    id="formula"
                    defaultValue={
                      contract.formula ?? undefined
                    }
                  >
                    {Object.values(ESCALATION_TYPE).map(
                      (type) => {
                        const id = `formula_${type}`
                        return (
                          <option key={id} value={type}>
                            {get_escalation_label(type)}
                          </option>
                        )
                      },
                    )}
                  </select>
                </p>
                <button
                  type="submit"
                  name="intent"
                  disabled={
                    contract.state !==
                    ContractState.INACTIVE
                  }
                  value={INTENT.UPDATE_CONTRACT}
                >
                  actualizar contrato
                </button>
                <button
                  type="submit"
                  name="intent"
                  disabled={
                    contract.state !==
                    ContractState.INACTIVE
                  }
                  value={INTENT.DESTROY_CONTRACT}
                >
                  eliminar contrato
                </button>
              </Form>
              <section>
                <h3>documentos</h3>
                <Form
                  method="POST"
                  encType="multipart/form-data"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <input
                    type="hidden"
                    value={contract.id}
                    name="contract_id"
                  />
                  <p>
                    <label htmlFor="file">documento</label>
                    <input
                      type="file"
                      id="file"
                      name="file"
                      disabled={
                        contract.state !==
                        ContractState.INACTIVE
                      }
                    />
                  </p>
                  <button
                    type="submit"
                    name="intent"
                    disabled={
                      contract.state !==
                      ContractState.INACTIVE
                    }
                    value={INTENT.CREATE_FILE}
                  >
                    agregar documento
                  </button>
                  <ul
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    {contract.files.map((file) => {
                      const id = `file_${file.basename}`
                      const contract_type = v.parse(
                        ContractTypeSchema,
                        file.type,
                      )
                      return (
                        <li
                          key={id}
                          style={{
                            display: "flex",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{ fontWeight: "bold" }}
                          >
                            {get_contract_type_label(
                              contract_type,
                            )}
                          </span>
                          <input
                            type="hidden"
                            value={file.id}
                            name="id"
                          />
                          <button
                            type="submit"
                            name="intent"
                            disabled={
                              contract.state !==
                              ContractState.INACTIVE
                            }
                            value={INTENT.DESTROY_FILE}
                          >
                            eliminar
                          </button>
                          <a href={`/files/${file.id}`}>
                            Download {file.basename}
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                </Form>
              </section>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function format_date_for_input(date: string) {
  return new Date(date).toISOString().slice(0, -8)
}
