// TODO: get DB type generated from "kysely-codegen"

import {
  Kysely,
  ParseJSONResultsPlugin,
  PostgresDialect,
} from "kysely"
import { Pool } from "pg"
import type { DB } from "./types"

if (!process.env.POSTGRES_USER)
  throw new Error("POSTGRES_USER is not set")
if (!process.env.POSTGRES_PASSWORD)
  throw new Error("POSTGRES_PASSWORD is not set")
if (!process.env.POSTGRES_DB)
  throw new Error("POSTGRES_DB is not set")
if (!process.env.POSTGRES_HOST)
  throw new Error("POSTGRES_HOST is not set")

console.log(
  "process.env.POSTGRES_USER",
  process.env.POSTGRES_USER,
)
console.log(
  "process.env.POSTGRES_PASSWORD",
  process.env.POSTGRES_PASSWORD,
)
console.log(
  "process.env.POSTGRES_DB",
  process.env.POSTGRES_DB,
)
console.log(
  "process.env.POSTGRES_HOST",
  process.env.POSTGRES_HOST,
)

const database_url = `postgres://${encodeURIComponent(process.env.POSTGRES_USER)}:${encodeURIComponent(process.env.POSTGRES_PASSWORD)}@${process.env.POSTGRES_HOST}:5432/${encodeURIComponent(process.env.POSTGRES_DB)}`

console.log("database_url", database_url)

export const query_builder = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    }),
  }),
  plugins: [new ParseJSONResultsPlugin()],
  log(event) {
    if (event.level === "error") {
      // eslint-disable-next-line no-console
      console.error("kysely error =>", event.error)
    }
    if (event.level === "query") {
      // eslint-disable-next-line no-console
      console.log(
        `duration: ${event.queryDurationMillis} ms`,
      )
    }
  },
})

export type QueryBuilder = typeof query_builder
