import type { Route } from "./+types/:id"
import { Form } from "react-router"
import { fetch_property } from "./fetchers/server/property"
import { error } from "~/lib/server/error"
import * as v from "valibot"
import { query_builder } from "~/lib/server/query_builder"
import { ForceNumberSchema } from "~/lib/server/force_number"
import { RoomType } from "~/lib/server/room_type"
import {
  LocationInput,
  LocationSchema,
} from "~/components/location_input"
import { useState } from "react"
import { compose_point } from "~/lib/server/point"
import { ContractState } from "~/lib/server/contract_state"

const ISO_8601_DURATION_REGEX =
  /^P(?=\d|T\d)(?:\d+W|(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:[.,]\d+)?S)?)?)$/
export const FrenquencySchema = v.pipe(
  v.string(),
  v.regex(
    ISO_8601_DURATION_REGEX,
    `use a valid ISO 8601 duration e.g. "P2W" or "P3M"`,
  ),
)
type Duration = v.InferOutput<typeof FrenquencySchema>
const DURATIONS: Duration[] = ["P3M", "P6M", "P1Y"]

function label_duration(duration: Duration) {
  switch (duration) {
    case "P3M": {
      return "3 meses"
    }
    case "P6M": {
      return "6 meses"
    }
    case "P1Y": {
      return "1 año"
    }
  }
}

export const FormulaSchema = v.object({
  label: v.string(),
  pattern: v.string(),
})
type Formula = v.InferOutput<typeof FormulaSchema>
const FORMULAS: Formula[] = [
  {
    pattern:
      "price * (ipc_current_month / ipc_four_months_ago)",
    label: "IPC",
  },
]

const INTENT = {
  UPDATE_LOCATION: "update_location",
  CREATE_ROOM: "create_room",
  UPDATE_ROOM: "update_room",
  DESTROY_ROOM: "destroy_room",
  CREATE_CONTRACT: "create_contract",
  UPDATE_CONTRACT: "update_contract",
  DESTROY_CONTRACT: "destroy_contract",
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
      await query_builder
        .updateTable("room")
        .set({ width, length, updated_at: new Date() })
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
          type: RoomType.BEDROOM,
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
      const now = new Date().toISOString()
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
    case INTENT.CREATE_CONTRACT: {
      const now = new Date().toISOString()
      await query_builder
        .insertInto("contract")
        .values({
          state: ContractState.INACTIVE,
          created_at: now,
          property_id,
          updated_at: now,
        })
        .execute()
      return null
    }
    case INTENT.UPDATE_CONTRACT: {
      const now = new Date().toISOString()
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
  }
  return null
}

export async function loader({ params }: Route.LoaderArgs) {
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
        <h2>contratos</h2>
        <ul>
          {property.contracts.map((contract) => {
            const id = `contract-${contract.id}`
            return (
              <li key={id}>
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
                            {label_duration(duration)}
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
                      {FORMULAS.map((formula) => {
                        const id = `formula_${formula.label}`
                        return (
                          <option
                            key={id}
                            value={formula.pattern}
                          >
                            {formula.label}
                          </option>
                        )
                      })}
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
                  <input type="hidden" />
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
              </li>
            )
          })}
        </ul>
        <Form method="POST">
          <button
            type="submit"
            name="intent"
            value={INTENT.CREATE_CONTRACT}
            disabled={
              !property.contracts.every((contract) => {
                return (
                  contract.state === ContractState.FINISHED
                )
              })
            }
          >
            agregar contrato
          </button>
        </Form>
      </section>
    </main>
  )
}
