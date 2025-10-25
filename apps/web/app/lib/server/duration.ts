import * as v from "valibot"

const ISO_8601_DURATION_REGEX =
  /^P(?=\d|T\d)(?:\d+W|(?:\d+Y)?(?:\d+M)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+(?:[.,]\d+)?S)?)?)$/
export const DurationSchema = v.pipe(
  v.string(),
  v.regex(
    ISO_8601_DURATION_REGEX,
    `use a valid ISO 8601 duration e.g. "P2W" or "P3M"`,
  ),
)
export type Duration = v.InferOutput<typeof DurationSchema>
export const DURATIONS: Duration[] = [
  "P1D",
  "P1W",
  "P3M",
  "P6M",
  "P1Y",
]

export function get_duration_label(duration: Duration) {
  switch (duration) {
    case "P1D": {
      return "1 día"
    }
    case "P1W": {
      return "1 semana"
    }
    case "P3M": {
      return "3 meses"
    }
    case "P6M": {
      return "6 meses"
    }
    case "P1Y": {
      return "1 año"
    }
    default: {
      throw new Error("unsupported duration type")
    }
  }
}
