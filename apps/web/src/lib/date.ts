import * as v from "valibot";

export const DateSchema = v.pipe(
  v.string(),
  v.transform((string) => {
    return string.length ? string : undefined;
  })
);

export function format_date_for_input(date: string | Date) {
  return new Date(date).toISOString().slice(0, -8);
}

export function get_date(date: Date) {
  return new Date(date).toISOString().split("T")[0];
}

export function get_time(date: Date) {
  return new Date(date).toISOString().split("T")[1];
}

export function get_month(date: Date) {
  return date.getMonth() + 1;
}

export function get_year(date: Date) {
  return date.getFullYear();
}
