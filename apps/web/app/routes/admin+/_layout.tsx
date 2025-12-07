import { Outlet } from "react-router"
import { Dashboard } from "~/components/dashboard"
import "./_layout.css"

export default function () {
  return (
    <div style={{ display: "flex" }}>
      <Dashboard.Root label="Admin navigation">
        <Dashboard.Section>
          <Dashboard.Link to="/admin/properties">
            Propiedades
          </Dashboard.Link>
          <Dashboard.Link to="/admin/tenants">
            Inquilinos
          </Dashboard.Link>
          <Dashboard.Link to="/admin/contracts?state=0">
            Contratos
          </Dashboard.Link>
        </Dashboard.Section>
      </Dashboard.Root>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
