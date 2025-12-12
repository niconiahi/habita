import Booking, { frontmatter as booking_frontmatter } from "./booking.mdx"

export const articles = [
  { ...booking_frontmatter, component: Booking },
] as const

export function get_article(slug: string) {
  return articles.find((a) => a.slug === slug)?.component ?? null
}
