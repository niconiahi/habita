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
              <Button.Root type="submit">
                Logout
              </Button.Root>
            </Form>
          </>
        ) : (
          <Form method="post" action="/auth/google">
            <Button.Root type="submit">Login</Button.Root>
          </Form>
        )}
      </nav>
    </header>
  )
}
