import * as v from "valibot"

export const RemoteNumberSchema = v.pipe(
  v.union([v.string(), v.number()]),
  v.transform(Number),
  v.number(),
)
