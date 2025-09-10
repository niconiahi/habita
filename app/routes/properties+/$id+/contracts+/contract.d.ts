import type { Props } from "./pdf"

declare module "*/contract.mdx" {
  import type { MDXContent } from "mdx/types"
  const ContractComponent: MDXContent<Props>
  export default ContractComponent
}
