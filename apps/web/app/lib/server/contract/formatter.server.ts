import { get_service_type_label } from "~/lib/service"
import type { Property } from "~/routes/properties+/fetchers/server/property.server"

export function day_as_word(day_number: number) {
  switch (day_number) {
    case 4: {
      return "Cuatro"
    }
    default:
      return String(day_number)
  }
}

export function get_day(date: Date | string) {
  const _date =
    typeof date === "string" ? new Date(date) : date
  return _date.getDate() // día del mes
}

export function get_month(date: Date | string) {
  const _date =
    typeof date === "string" ? new Date(date) : date
  return _date
    .toLocaleString("es-AR", { month: "long" })
    .toLocaleUpperCase()
}

export function get_year(date: Date | string) {
  const _date =
    typeof date === "string" ? new Date(date) : date
  return _date.getFullYear()
}

export function concatenate_services(
  services: Property["services"],
) {
  return services
    .map((service) => {
      return get_service_type_label(service.type)
    })
    .join(", ")
}
