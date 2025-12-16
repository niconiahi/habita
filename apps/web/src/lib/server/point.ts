import { sql } from "kysely";

export function compose_point(latitude: number, longitude: number) {
  return sql<string>`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
}
