import { type ReactNode, useId } from "react"
import { NavLink } from "react-router"
import "~/components/dashboard.css"

function Root({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <nav className="dashboard" aria-label={label}>
      {children}
    </nav>
  )
}

function Section({
  children,
  label,
}: {
  children: ReactNode
  label?: string
}) {
  const id = useId()
  return (
    <section aria-labelledby={label ? id : undefined}>
      {label ? (
        <h2 id={id} className="dashboard-section-label">
          {label}
        </h2>
      ) : null}
      <ul>{children}</ul>
    </section>
  )
}

function Link({
  children,
  to,
}: {
  children: ReactNode
  to: string
}) {
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
