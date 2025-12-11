import Booking from "./booking.mdx"

const articles = {
  booking: Booking,
} as const

type Slug = keyof typeof articles

export function get_article(slug: string) {
  const key = slug.replace(/-/g, "_") as Slug
  return articles[key] ?? null
}
