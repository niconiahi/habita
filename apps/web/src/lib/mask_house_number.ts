interface Location {
  house_number: number
}

export function mask_house_number<T extends Location>(
  location: T,
): T {
  const digits = String(location.house_number)
  const masked =
    digits.length <= 2
      ? 0
      : Number(`${digits.slice(0, -2)}00`)
  return { ...location, house_number: masked }
}
