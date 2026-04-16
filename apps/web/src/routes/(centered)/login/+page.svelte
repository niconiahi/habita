<script lang="ts">
  import { goto } from "$app/navigation"
  import { authClient } from "$lib/auth-client"
  import Button from "$lib/components/Button.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import Google from "$icon/Google.svelte"

  const BETTER_AUTH_DEFAULT_ERROR_MESSAGE = "Invalid email"

  let error = $state<string | null>(null)
  let is_loading = $state(false)

  async function handle_email_login(event: SubmitEvent) {
    event.preventDefault()
    error = null
    is_loading = true

    const form_data = new FormData(
      event.currentTarget as HTMLFormElement,
    )
    const email = String(form_data.get("email"))
    const password = String(form_data.get("password"))

    const { error: auth_error } =
      await authClient.signIn.email({
        email,
        password,
        callbackURL: "/properties",
      })

    is_loading = false

    if (auth_error) {
      if (auth_error.status === 403) {
        error = "Verificá tu email antes de iniciar sesión"
        return
      }
      if (
        auth_error?.message ===
        BETTER_AUTH_DEFAULT_ERROR_MESSAGE
      ) {
        error = "El email o la contraseña son incorrectas"
      }
      return
    }

    goto("/properties")
  }

  async function handle_google_login() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/properties",
    })
  }
</script>

<div class="centered">
  <div class="card">
    <form class="form" onsubmit={handle_email_login}>
      <Formulary.Input
        label="Email"
        name="email"
        type="email"
        required
        autocomplete="email"
      />
      <Formulary.Input
        label="Contraseña"
        name="password"
        type="password"
        required
        autocomplete="current-password"
        minlength={8}
        error={error ?? undefined}
      />
      <Button
        variant="primary"
        type="submit"
        disabled={is_loading}
      >
        {is_loading ? "Cargando..." : "Ingresar"}
      </Button>
      <Button
        variant="secondary"
        type="button"
        onclick={handle_google_login}
      >
        <Google />
        Ingresar con Google
      </Button>
      <p class="body-md-medium footer">
        ¿No tenés cuenta?
        <a class="link" href="/signup">Crear cuenta</a>
      </p>
    </form>
  </div>
</div>

<style>
  .centered {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .card {
    border: 2px solid var(--card-border);
    border-radius: var(--dimension-radius-2xl);
    padding: var(--dimension-spacing-6);
    width: 443px;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-3);
  }

  .footer {
    display: flex;
    gap: var(--dimension-spacing-2);
    align-items: center;
    color: var(--color-text-body);
    margin: 0;
  }
</style>
