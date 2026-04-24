export function display_location(location: {
  road: string
  house_number: number
  suburb: string | null
  city: string | null
  town: string | null
  state: string | null
}) {
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
