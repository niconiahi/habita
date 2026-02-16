<script lang="ts">
  import { goto } from "$app/navigation"
  import { authClient } from "$lib/auth-client"
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import Button from "$lib/components/Button.svelte"

  let email = $state("")
  let password = $state("")
  let error = $state<string | null>(null)
  let is_loading = $state(false)

  async function handle_email_login(event: SubmitEvent) {
    event.preventDefault()
    error = null
    is_loading = true

    const { error: auth_error } =
      await authClient.signIn.email({
        email,
        password,
        callbackURL: "/properties",
      })

    is_loading = false

    if (auth_error) {
      error =
        auth_error.message ?? "Error al iniciar sesión"
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

{#snippet EmailPasswordForm()}
  <Content.Section>
    <Section.Header>
      <Section.Title>iniciar sesión con email</Section.Title
      >
    </Section.Header>
    <form class="form" onsubmit={handle_email_login}>
      <div class="field">
        <label class="label" for="email">email</label>
        <input
          id="email"
          name="email"
          type="email"
          bind:value={email}
          required
          autocomplete="email"
        />
      </div>
      <div class="field">
        <label class="label" for="password"
          >contraseña</label
        >
        <input
          id="password"
          name="password"
          type="password"
          bind:value={password}
          required
          autocomplete="current-password"
          minlength={8}
        />
      </div>
      {#if error}
        <p class="error">{error}</p>
      {/if}
      <div class="actions">
        <Button type="submit" disabled={is_loading}>
          {is_loading ? "Cargando..." : "Iniciar sesión"}
        </Button>
      </div>
    </form>
  </Content.Section>
{/snippet}

{#snippet GoogleLogin()}
  <Content.Section>
    <Section.Header>
      <Section.Title>o continuar con</Section.Title>
    </Section.Header>
    <div class="actions">
      <Button onclick={handle_google_login}>Google</Button>
    </div>
  </Content.Section>
{/snippet}

{#snippet SignupLink()}
  <Content.Section>
    <p class="link-text">
      ¿No tienes cuenta? <a href="/signup">Crear cuenta</a>
    </p>
  </Content.Section>
{/snippet}

<Content.Root>
  <Content.Title>Login</Content.Title>
  {@render EmailPasswordForm()}
  {@render GoogleLogin()}
  {@render SignupLink()}
</Content.Root>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .label {
    color: var(--gray-100);
    display: block;
  }

  .label::first-letter {
    text-transform: uppercase;
  }

  .error {
    color: var(--destructive);
    font-size: var(--spacing-3);
  }

  .actions {
    display: flex;
    gap: var(--spacing-2);
  }

  .link-text {
    color: var(--gray-300);
  }

  .link-text a {
    color: var(--accent);
    text-decoration: underline;
  }
</style>
