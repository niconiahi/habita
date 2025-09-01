import { PostgresDialect } from "kysely"
import { defineConfig } from "kysely-ctl"
import { Pool } from "pg"

export default defineConfig({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    }),
  }),
  migrations: {
    migrationFolder: "db/migrations",
  },
  seeds: {
    seedFolder: "db/seeds",
  },
})
