if (!process.env.NODE_ENV)
  throw new Error("NODE_ENV is not set")

export function get_origin() {
  return process.env.NODE_ENV === "development"
    ? "https://dev.habita.rent"
    : "https://habita.rent"
}
