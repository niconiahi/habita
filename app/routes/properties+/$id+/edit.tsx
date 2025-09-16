import { useState } from "react"
import { Form, Link } from "react-router"
import * as v from "valibot"
import {
  LocationInput,
  LocationSchema,
} from "~/components/location_input"
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
import { compose_point } from "~/lib/server/point"
import { has_edit_access } from "~/lib/server/property_access"
import { query_builder } from "~/lib/server/query_builder"
import {
  display_room_type,
  ROOM_TYPE,
  RoomTypeSchema,
} from "~/lib/room_type"
import { fetch_property } from "../fetchers/server/property"
import type { Route } from "./+types/edit"
import { kv } from "~/lib/server/kv"
import { compose_file_cache_key } from "~/routes/files+/$id"

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
} as const

const DateSchema = v.pipe(
  v.string(),
  v.transform((string) => {
    return string.length ? string : undefined
  }),
)

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
  const now = new Date().toISOString()
  const property_id = v.parse(
    ForceNumberSchema,
    params.id,
    {
      message: "property id should be a number",
    },
  )
  switch (intent) {
    case INTENT.UPDATE_ROOM: {
      const length = v.parse(
        ForceNumberSchema,
        form_data.get("length"),
      )
      const width = v.parse(
        ForceNumberSchema,
        form_data.get("width"),
      )
      const id = v.parse(
        ForceNumberSchema,
        form_data.get("id"),
      )
      const room_type = v.parse(
        v.pipe(
          v.string(),
          v.transform(Number),
          RoomTypeSchema,
        ),
        form_data.get("type"),
      )
      await query_builder
        .updateTable("room")
        .set({
          width,
          length,
          updated_at: new Date(),
          type: room_type,
        })
        .where("room.id", "=", id)
        .execute()
      return null
    }
    case INTENT.DESTROY_ROOM: {
      const id = v.parse(
        ForceNumberSchema,
        form_data.get("id"),
      )
      await query_builder
        .deleteFrom("room")
        .where("room.id", "=", id)
        .execute()
      return null
    }
    case INTENT.CREATE_ROOM: {
      await query_builder
        .insertInto("room")
        .values({
          width: 0,
          length: 0,
          type: ROOM_TYPE.BEDROOM,
          updated_at: now,
          created_at: now,
          property_id,
        })
        .execute()
      return null
    }
    case INTENT.UPDATE_LOCATION: {
      const id = v.parse(
        ForceNumberSchema,
        form_data.get("id"),
      )
      const location = v.parse(
        LocationSchema,
        JSON.parse(form_data.get("location") as string),
      )
      await query_builder
        .updateTable("location")
        .set({
          id,
          latitude: location.lat,
          longitude: location.lon,
          point: compose_point(location.lat, location.lon),
          house_number: location.address.house_number,
          address: location.display_name,
          road: location.address.road,
          city: location.address.city,
          town: location.address.town,
          state: location.address.state,
          suburb: location.address.suburb,
          updated_at: now,
        })
        .where("location.id", "=", id)
        .execute()
      return null
    }
    case INTENT.UPDATE_CONTRACT: {
      const id = v.parse(
        ForceNumberSchema,
        form_data.get("id"),
      )
      const formula = v.parse(
        v.string(),
        form_data.get("formula"),
      )
      const duration = v.parse(
        v.string(),
        form_data.get("duration"),
      )
      const start_date = v.parse(
        DateSchema,
        form_data.get("start_date"),
      )
      const end_date = v.parse(
        DateSchema,
        form_data.get("end_date"),
      )
      await query_builder
        .updateTable("contract")
        .set({
          property_id,
          updated_at: now,
          formula,
          duration,
          start_date,
          end_date,
        })
        .where("contract.id", "=", id)
        .execute()
      return null
    }
    case INTENT.DESTROY_CONTRACT: {
      const id = v.parse(
        ForceNumberSchema,
        form_data.get("id"),
      )
      await query_builder
        .deleteFrom("contract")
        .where("contract.id", "=", id)
        .execute()
      return null
    }
    case INTENT.CREATE_FILE: {
      const contract_id = v.parse(
        ForceNumberSchema,
        form_data.get("contract_id"),
      )
      const file_ = v.parse(
        v.instance(File),
        form_data.get("file"),
      )
      await query_builder
        .transaction()
        .execute(async (tx) => {
          const content = Buffer.from(await file_.bytes())
          const hash = Bun.CryptoHasher.hash(
            "sha256",
            content,
            "hex",
          )
          const file = await tx
            .insertInto("file")
            .values({
              mime: file_.type,
              basename: file_.name,
              content,
              created_at: now,
              updated_at: now,
              hash,
              size: file_.size,
            })
            .returning("id")
            .executeTakeFirstOrThrow()
          await tx
            .insertInto("contract_file")
            .values({
              user_id: 1,
              file_id: file.id,
              contract_id,
              created_at: now,
              updated_at: now,
            })
            .returning("id")
            .executeTakeFirstOrThrow()
        })
      return null
    }
    case INTENT.DESTROY_FILE: {
      const id = v.parse(
        ForceNumberSchema,
        form_data.get("id"),
      )
      const contract_id = v.parse(
        ForceNumberSchema,
        form_data.get("contract_id"),
      )
      await query_builder
        .transaction()
        .execute(async (tx) => {
          await tx
            .deleteFrom("contract_file")
            .where((eb) =>
              eb.and([
                eb("contract_file.file_id", "=", id),
                eb(
                  "contract_file.contract_id",
                  "=",
                  contract_id,
                ),
              ]),
            )
            .execute()
          await tx
            .deleteFrom("file")
            .where("file.id", "=", id)
            .execute()
        })
      const cache_key = compose_file_cache_key(id)
      await kv.del(cache_key)
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

function format_date_for_input(date: string) {
  return new Date(date).toISOString().slice(0, -8)
}

// function pluralize(word: string, count: number) {
//   if (count > 1) {
//     return `${word}s`
//   }
//   return word
// }

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const { property } = loaderData
  const [disabled, set_disabled] = useState(true)
  return (
    <main>
      <h1>propiedad</h1>
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
                        (room_type) => {
                          const id = `room_type_${room_type}`
                          return (
                            <option
                              key={id}
                              value={room_type}
                            >
                              {display_room_type(room_type)}
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
                    guardar cambios
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
                      <label htmlFor="file">
                        documento
                      </label>
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
                    <ul>
                      {contract.files.map((file) => {
                        const id = `file_${file.basename}`
                        return (
                          <li key={id}>
                            <span>{file.basename}</span>
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
    </main>
  )
}
