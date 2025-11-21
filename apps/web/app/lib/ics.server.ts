export function escape_ics_text(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

export function format_ics_date(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )
  const day = String(date.getUTCDate()).padStart(2, "0")
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(
    2,
    "0",
  )
  const seconds = String(date.getUTCSeconds()).padStart(
    2,
    "0",
  )

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}
