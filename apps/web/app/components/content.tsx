import type { ReactNode } from "react"
import "~/components/content.css"

function Root({
  children,
  label,
}: {
  children: ReactNode
  label?: string
}) {
  return <main aria-label={label}>{children}</main>
}
function Section({ children }: { children: ReactNode }) {
  return <section>{children}</section>
}

function Title({ children }: { children: ReactNode }) {
  return <h1>{children}</h1>
}

export const Content = {
  Root,
  Section,
  Title,
}
