import * as v from "valibot"

export const ForceNumberSchema = v.pipe(
  v.string(),
  v.transform(Number),
  v.number(),
)
