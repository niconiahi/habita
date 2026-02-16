<script lang="ts">
  import { goto } from "$app/navigation"
  import { authClient } from "$lib/auth-client"
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import Button from "$lib/components/Button.svelte"

  let name = $state("")
  let surname = $state("")
  let email = $state("")
  let password = $state("")
  let error = $state<string | null>(null)
  let is_loading = $state(false)

  async function handle_signup(event: SubmitEvent) {
    event.preventDefault()
    error = null
    is_loading = true

    const { error: auth_error } =
      await authClient.signUp.email({
        name,
        email,
        password,
        surname,
        callbackURL: "/properties",
      })

    is_loading = false

    if (auth_error) {
      error =
        auth_error.message ?? "Error al crear la cuenta"
      return
    }

    goto("/properties")
  }

  async function handle_google_signup() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/properties",
    })
  }
</script>

{#snippet SignupForm()}
  <Content.Section>
    <Section.Header>
      <Section.Title>crear cuenta con email</Section.Title>
    </Section.Header>
    <form class="form" onsubmit={handle_signup}>
      <div class="field">
        <label class="label" for="name">nombre</label>
        <input
          id="name"
          name="name"
          type="text"
          bind:value={name}
          required
          autocomplete="given-name"
        />
      </div>
      <div class="field">
        <label class="label" for="surname">apellido</label>
        <input
          id="surname"
          name="surname"
          type="text"
          bind:value={surname}
          required
          autocomplete="family-name"
        />
      </div>
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
          autocomplete="new-password"
          minlength={8}
        />
        <p class="hint">mínimo 8 caracteres</p>
      </div>
      {#if error}
        <p class="error">{error}</p>
      {/if}
      <div class="actions">
        <Button type="submit" disabled={is_loading}>
          {is_loading ? "Cargando..." : "Crear cuenta"}
        </Button>
      </div>
    </form>
  </Content.Section>
{/snippet}

{#snippet GoogleSignup()}
  <Content.Section>
    <Section.Header>
      <Section.Title>o continuar con</Section.Title>
    </Section.Header>
    <div class="actions">
      <Button onclick={handle_google_signup}>Google</Button>
    </div>
  </Content.Section>
{/snippet}

{#snippet LoginLink()}
  <Content.Section>
    <p class="link-text">
      ¿Ya tienes cuenta? <a href="/login">Iniciar sesión</a>
    </p>
  </Content.Section>
{/snippet}

<Content.Root>
  <Content.Title>Crear cuenta</Content.Title>
  {@render SignupForm()}
  {@render GoogleSignup()}
  {@render LoginLink()}
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

  .hint {
    color: var(--gray-400);
    font-size: 0.75rem;
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
