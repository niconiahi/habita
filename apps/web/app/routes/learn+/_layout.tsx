import { Outlet } from "react-router"
import { Dashboard } from "~/components/dashboard"
import { articles } from "mdx/learn"
import "./_layout.css"

export default function() {
  return (
    <div style={{ display: "flex" }}>
      <Dashboard.Root label="Learn navigation">
        <Dashboard.Section>
          {articles.map(({ slug, title }) => (
            <Dashboard.Link key={slug} to={`/learn/${slug}`}>
              {title}
            </Dashboard.Link>
          ))}
        </Dashboard.Section>
      </Dashboard.Root>
      <Outlet />
    </div>
  )
}
