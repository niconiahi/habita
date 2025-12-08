import { Link } from "react-router"
import "~/components/button.css"
import { Content } from "~/components/content"

export default function () {
  return (
    <Content.Root>
      <Content.Title>Reserva restringida</Content.Title>
      <Content.Section>
        <p>
          Para reservar una visita, primero debes subir tu informe crediticio.
        </p>
        <Link to="/profile" className="button">
          Ir a mi perfil
        </Link>
      </Content.Section>
    </Content.Root>
  )
}
