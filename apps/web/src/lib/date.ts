import * as v from "valibot"

export const DateSchema = v.pipe(
  v.string(),
  v.transform((string) => {
    return string.length ? string : undefined
  }),
)

export function format_date_for_input(date: string | Date) {
  return new Date(date).toISOString().slice(0, -8)
}

export function get_date(date: Date) {
  return new Date(date).toISOString().split("T")[0]
}

export function get_time(date: Date) {
  return new Date(date).toISOString().split("T")[1]
}

export function get_day(date: Date | string) {
  const _date =
    typeof date === "string" ? new Date(date) : date
  return _date.getDate() // día del mes
}

export function get_month(
  date: Date | string,
  as?: "number",
): number
export function get_month(
  date: Date | string,
  as: "word",
): string
export function get_month(
  date: Date | string,
  as: "number" | "word" = "number",
) {
  const _date =
    typeof date === "string" ? new Date(date) : date
  if (as === "number") {
    return _date.getMonth() + 1
  }
  return _date
    .toLocaleString("es-AR", { month: "long" })
    .toLocaleUpperCase()
}

export function get_year(date: Date | string) {
  const _date =
    typeof date === "string" ? new Date(date) : date
  return _date.getFullYear()
}
