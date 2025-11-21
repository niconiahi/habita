import { Kysely, ParseJSONResultsPlugin } from "kysely"
import { DIALECT } from "./dialect"
import type { DB } from "./types"
import { logger } from "~/lib/telemetry/log.server"

export const query_builder = new Kysely<DB>({
  dialect: DIALECT,
  plugins: [new ParseJSONResultsPlugin()],
  log(event) {
    if (event.level === "error") {
      logger.error(
        event.error as Error,
        "kysely error",
      )
    }
    if (event.level === "query") {
      logger.info("kysely query", {
        duration_ms: event.queryDurationMillis,
      })
    }
  },
})

export type QueryBuilder = typeof query_builder
