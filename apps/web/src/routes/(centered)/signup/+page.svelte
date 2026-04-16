<script lang="ts">
  import { goto } from "$app/navigation"
  import { authClient } from "$lib/auth-client"
  import Button from "$lib/components/Button.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import Google from "$icon/Google.svelte"

  let error = $state<string | null>(null)
  let is_loading = $state(false)

  async function handle_signup(event: SubmitEvent) {
    event.preventDefault()
    error = null

    const form_data = new FormData(
      event.currentTarget as HTMLFormElement,
    )
    const name = String(form_data.get("name"))
    const surname = String(form_data.get("surname"))
    const email = String(form_data.get("email"))
    const password = String(form_data.get("password"))
    const password_confirmation = String(
      form_data.get("password_confirmation"),
    )

    if (password !== password_confirmation) {
      error = "Las contraseñas no son iguales"
      return
    }

    is_loading = true

    const { error: auth_error } =
      await authClient.signUp.email({
        name,
        surname,
        email,
        password,
        callbackURL: "/onboarding",
      })

    is_loading = false

    if (auth_error) {
      error = "Error al crear la cuenta"
      return
    }

    goto("/signup/verification")
  }

  async function handle_google_signup() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/onboarding",
    })
  }
</script>

<div class="centered">
  <div class="card">
    <form class="form" onsubmit={handle_signup}>
      <Formulary.Input
        label="Nombre"
        name="name"
        type="text"
        required
        autocomplete="given-name"
      />
      <Formulary.Input
        label="Apellido"
        name="surname"
        type="text"
        required
        autocomplete="family-name"
      />
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
        autocomplete="new-password"
        minlength={8}
      />
      <Formulary.Input
        label="Confirmación de contraseña"
        name="password_confirmation"
        type="password"
        required
        autocomplete="new-password"
        minlength={8}
        error={error ?? undefined}
      />
      <Button
        variant="primary"
        type="submit"
        disabled={is_loading}
      >
        {is_loading ? "Cargando..." : "Crear cuenta"}
      </Button>
      <Button
        variant="secondary"
        type="button"
        onclick={handle_google_signup}
      >
        <Google />
        Crear con Google
      </Button>
      <p class="body-md-medium footer">
        ¿Ya tenés cuenta?
        <a class="link" href="/login"
          >Ingresar con tu cuenta</a
        >
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
