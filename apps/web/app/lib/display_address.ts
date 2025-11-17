import type { Property } from "~/routes/properties+/fetchers/server/property.server"

export function display_location(
  location: Property["location"],
) {
  const road_and_number = `${location.road} ${location.house_number}`
  if (location.suburb) {
    return `${road_and_number}, ${location.suburb}, ${location.state}`
  }
  if (location.city) {
    return `${road_and_number}, ${location.city}, ${location.state}`
  }
  if (location.town) {
    return `${road_and_number}, ${location.town}, ${location.state}`
  }
  return "direccion invalida. Por favor, informar asi se arregla"
}
