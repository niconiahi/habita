import * as v from "valibot"

export const ForceDateSchema = v.pipe(
  v.string(),
  v.transform((string) => new Date(string)),
  v.date(),
)
