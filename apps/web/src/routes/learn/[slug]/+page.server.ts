import { error } from "@sveltejs/kit";
import { get_article } from "$lib/learn";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const article = get_article(params.slug);
  if (!article) {
    error(404, "Article not found");
  }
  return { article };
};
