import { Kysely, ParseJSONResultsPlugin } from "kysely"
import { DIALECT } from "../src/lib/server/db/dialect"
import { TelemetryPlugin } from "./telemetry_plugin"
import type { DB } from "./types"

export const query_builder = new Kysely<DB>({
  dialect: DIALECT,
  plugins: [
    new ParseJSONResultsPlugin(),
    new TelemetryPlugin(),
  ],
})

export type QueryBuilder = typeof query_builder
