import { type ReactNode } from "react"
import "~/components/section.css"

function Header({ children }: { children: ReactNode }) {
  return <header className="section">{children}</header>
}
function Title({ children }: { children: ReactNode }) {
  return <h3>{children}</h3>
}
function Actions({ children }: { children: ReactNode }) {
  return <div className="actions">{children}</div>
}

export const Section = {
  Header,
  Title,
  Actions,
}
