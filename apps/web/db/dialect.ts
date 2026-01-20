import { PostgresDialect } from "kysely"
import pg from "pg"
import { lazy } from "$lib/server/lazy"

export const DIALECT = lazy<PostgresDialect>(() => {
  if (!process.env.POSTGRES_USER) throw new Error("POSTGRES_USER is not set")
  if (!process.env.POSTGRES_PASSWORD) throw new Error("POSTGRES_PASSWORD is not set")
  if (!process.env.POSTGRES_DB) throw new Error("POSTGRES_DB is not set")
  if (!process.env.POSTGRES_HOST) throw new Error("POSTGRES_HOST is not set")

  return new PostgresDialect({
    pool: new pg.Pool({
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    }),
  })
})
