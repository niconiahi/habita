import { type ReactNode } from "react"
import "~/components/content.css"

function Root({ children }: { children: ReactNode }) {
  return <main>{children}</main>
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
