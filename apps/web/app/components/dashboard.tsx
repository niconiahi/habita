import { useId, type ReactNode } from "react"
import { NavLink } from "react-router"
import "~/components/dashboard.css"

type RootProps = {
  children: ReactNode
  label: string
}
function Root({ children, label }: RootProps) {
  return (
    <nav className="dashboard" aria-label={label}>
      {children}
    </nav>
  )
}

type SectionProps = {
  children: ReactNode
  label?: string
}
function Section({ children, label }: SectionProps) {
  const id = useId()
  return (
    <section aria-labelledby={label ? id : undefined}>
      {label ? (
        <h2 id={id} className="dashboard-section-label">
          {label}
        </h2>
      ) : null}
      <ul role="list">{children}</ul>
    </section>
  )
}

type LinkProps = {
  children: ReactNode
  to: string
}
function Link({ children, to }: LinkProps) {
  return (
    <li>
      <NavLink to={to}>{children}</NavLink>
    </li>
  )
}

export const Dashboard = {
  Root,
  Section,
  Link,
}
