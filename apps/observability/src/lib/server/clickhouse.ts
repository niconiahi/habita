import * as v from "valibot"
import { safe_async } from "$lib/safe_async"

const CLICKHOUSE_URL =
  process.env.CLICKHOUSE_URL ?? "http://telemetry-db:8123"

export function escape_clickhouse(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}

export async function query_clickhouse<T>(
  sql: string,
  schema: v.GenericSchema<T>,
): Promise<[Error, null] | [null, T[]]> {
  const url = new URL("/", CLICKHOUSE_URL)
  url.searchParams.set("query", `${sql} FORMAT JSON`)
  url.searchParams.set("database", "otel")

  const [fetch_error, response] = await safe_async(
    fetch(url.toString()),
  )
  if (fetch_error) {
    return [fetch_error, null]
  }
  if (!response.ok) {
    const text = await response.text()
    return [
      new Error(
        `Error de ClickHouse (${response.status}): ${text}`,
      ),
      null,
    ]
  }

  const [json_error, body] = await safe_async(
    response.json(),
  )
  if (json_error) {
    return [json_error, null]
  }

  const ClickHouseResponseSchema = v.object({
    data: v.array(schema),
  })
  const parsed = v.safeParse(ClickHouseResponseSchema, body)
  if (!parsed.success) {
    return [
      new Error(
        "Error al validar la respuesta de ClickHouse",
      ),
      null,
    ]
  }
  return [null, parsed.output.data]
}
