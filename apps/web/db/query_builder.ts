import { Kysely, ParseJSONResultsPlugin } from "kysely"
import { DIALECT } from "./dialect"
import type { DB } from "./types"
import { TelemetryPlugin } from "./telemetry_plugin"

export const query_builder = new Kysely<DB>({
  dialect: DIALECT,
  plugins: [
    new ParseJSONResultsPlugin(),
    new TelemetryPlugin(),
  ],
})

export type QueryBuilder = typeof query_builder
