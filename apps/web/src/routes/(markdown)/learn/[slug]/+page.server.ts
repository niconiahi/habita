import { error } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"
import { fetch_article } from "./fetchers"

export const load: PageServerLoad = async ({ params }) => {
  const article = fetch_article(params.slug)
  if (!article) {
    error(404, "Article not found")
  }
  return { article }
}
