export function display_location(location: {
  road: string
  house_number: number
  suburb: string | null
  city: string | null
  town: string | null
  state: string | null
}) {
  const road_and_number = `${location.road} ${location.house_number}`
  const area = location.suburb ?? location.city ?? location.town
  if (!area) {
    return "direccion invalida. Por favor, informar asi se arregla"
  }
  const parts = [road_and_number, area, location.state].filter((part) => part !== null && part !== "")
  return parts.join(", ")
}
