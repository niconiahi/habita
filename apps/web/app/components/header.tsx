import { Form } from "react-router"
import "./header.css"
import { Button } from "~/components/button"
import type { Auth } from "~/lib/auth.server"

export function Header({ auth }: { auth: Auth }) {
  return (
    <header>
      <nav>
        {auth.user ? (
          <>
            <span>{auth.user.email}</span>
            <Form method="post" action="/auth/logout">
              <Button type="submit">Logout</Button>
            </Form>
          </>
        ) : (
          <Form method="post" action="/auth/google">
            <Button type="submit">Login</Button>
          </Form>
        )}
      </nav>
    </header>
  )
}
