import { DIALECT } from "db/dialect"
import type { DB } from "db/types"
import { Kysely, ParseJSONResultsPlugin } from "kysely"

export const query_builder = new Kysely<DB>({
  dialect: DIALECT,
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
