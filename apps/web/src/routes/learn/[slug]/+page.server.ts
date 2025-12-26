import { error } from "@sveltejs/kit"
import { fetch_article } from "./fetchers"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params }) => {
  const article = fetch_article(params.slug)
  if (!article) {
    error(404, "Article not found")
  }
  return { article }
}
