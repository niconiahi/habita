declare module "*.mdx" {
  import type { MDXContent } from "mdx/types"
  const MDXComponent: MDXContent<Record<string, any>>
  export const frontmatter: { slug: string; title: string }
  export default MDXComponent
}
