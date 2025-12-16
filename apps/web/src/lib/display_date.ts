const TIMEZONE = "America/Argentina/Buenos_Aires";

export function display_date(date: Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...options
  }).format(new Date(date));
}
