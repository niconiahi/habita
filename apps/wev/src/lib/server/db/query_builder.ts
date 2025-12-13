import { Kysely, ParseJSONResultsPlugin } from "kysely";
import { DIALECT } from "./dialect";
import type { DB } from "./types";

export const query_builder = new Kysely<DB>({
  dialect: DIALECT,
  plugins: [new ParseJSONResultsPlugin()],
  log(event) {
    if (event.level === "error") {
      console.error("kysely error =>", event.error);
    }
    if (event.level === "query") {
      console.log(`duration: ${event.queryDurationMillis} ms`);
    }
  },
});

export type QueryBuilder = typeof query_builder;
