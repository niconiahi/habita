import { Outlet } from "react-router"
import { Dashboard } from "~/components/dashboard"

export default function () {
  return (
    <div style={{ display: "flex" }}>
      <Dashboard.Root label="Webmaster navigation">
        <Dashboard.Section>
          <Dashboard.Link to="/rates">Rates</Dashboard.Link>
        </Dashboard.Section>
      </Dashboard.Root>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  )
}
