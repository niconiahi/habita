import { Link } from "react-router"
import { Content } from "~/components/content"

export function meta() {
  return [
    { title: "New React Router App" },
    {
      name: "description",
      content: "Welcome to React Router!",
    },
  ]
}

export default function Home() {
  return (
    <Content.Root>
      <Content.Title>Bienvenido</Content.Title>
      <Content.Section>
        <Link to="/properties" reloadDocument>
          propiedades
        </Link>
      </Content.Section>
    </Content.Root>
  )
}
