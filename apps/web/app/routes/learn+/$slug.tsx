import { get_article } from "mdx/learn"
import { Content } from "~/components/content"
import type { Route } from "./+types/$slug"

export function loader({ params }: Route.LoaderArgs) {
  const Article = get_article(params.slug)
  if (!Article) {
    throw new Response("Article not found", { status: 404 })
  }
  return { slug: params.slug }
}

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const Article = get_article(loaderData.slug)!
  return (
    <Content.Root>
      <Article />
    </Content.Root>
  )
}
