import { Link, Outlet } from "react-router"

export default function () {
  return (
    <div>
      <nav>
        <Link to=".">All Properties</Link>
        <Link to="new">New Property</Link>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
