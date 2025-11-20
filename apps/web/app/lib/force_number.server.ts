import * as v from "valibot"

export const ForceNumberSchema = v.pipe(
  v.union([v.string(), v.undefined()]),
  v.check(
    (val): val is string => val !== undefined,
    "Una seleccion es requerida",
  ),
  v.string(),
  v.transform(Number),
  v.number(),
)
