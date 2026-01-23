export function get_origin() {
  if (!process.env.NODE_ENV)
    throw new Error("NODE_ENV is not set")

  return process.env.NODE_ENV === "development"
    ? "https://dev.habita.rent"
    : "https://habita.rent"
}
