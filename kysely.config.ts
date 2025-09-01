import { defineConfig } from "kysely-ctl"
import { DIALECT } from "db/dialect"

export default defineConfig({
  dialect: DIALECT,
  migrations: {
    migrationFolder: "db/migrations",
  },
  seeds: {
    seedFolder: "db/seeds",
  },
})
