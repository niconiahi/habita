import * as v from "valibot"

export const DateSchema = v.pipe(
  v.string(),
  v.transform((string) => {
    return string.length ? string : undefined
  }),
)
