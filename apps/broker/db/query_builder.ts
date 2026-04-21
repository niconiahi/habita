import {
  Kysely,
  ParseJSONResultsPlugin,
  PostgresDialect,
} from "kysely"
import pg from "pg"
import { TelemetryPlugin } from "./telemetry_plugin"
import type { DB } from "./types"

function make_query_builder() {
  if (!process.env.POSTGRES_USER)
    throw new Error("POSTGRES_USER is not set")
  if (!process.env.POSTGRES_PASSWORD)
    throw new Error("POSTGRES_PASSWORD is not set")
  if (!process.env.POSTGRES_DB)
    throw new Error("POSTGRES_DB is not set")
  if (!process.env.POSTGRES_HOST)
    throw new Error("POSTGRES_HOST is not set")

  const dialect = new PostgresDialect({
    pool: new pg.Pool({
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      max: 10,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    }),
  })

  return new Kysely<DB>({
    dialect,
    plugins: [
      new ParseJSONResultsPlugin(),
      new TelemetryPlugin(),
    ],
  })
}

export const query_builder = (globalThis.__query_builder ??=
  make_query_builder()) as Kysely<DB>

export type QueryBuilder = Kysely<DB>
