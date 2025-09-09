declare module "*.mdx" {
  import type { MDXContent } from "mdx/types"
  const MDXComponent: MDXContent<Record<string, any>>
  export default MDXComponent
}
