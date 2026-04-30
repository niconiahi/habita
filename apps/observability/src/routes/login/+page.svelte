<script lang="ts">
  let email = $state("")
  let password = $state("")
  let error_message = $state("")
  let loading = $state(false)

  async function handle_submit(event: SubmitEvent) {
    event.preventDefault()
    error_message = ""
    loading = true

    const response = await fetch(
      "/api/auth/sign-in/email",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      },
    )

    if (response.ok) {
      window.location.href = "/logs"
    } else {
      error_message = "Credenciales incorrectas"
      loading = false
    }
  }

  async function handle_google_login() {
    const response = await fetch(
      "/api/auth/sign-in/social",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          callbackURL: "/logs",
        }),
      },
    )

    const data = await response.json()
    if (data.url) {
      window.location.href = data.url
    }
  }
</script>

<svelte:head>
  <title>Login | Observability</title>
</svelte:head>

<div class="page">
  <form class="form" onsubmit={handle_submit}>
    <h1 class="title">observability</h1>

    {#if error_message}
      <p class="error">{error_message}</p>
    {/if}

    <label class="field">
      <span class="label">Email</span>
      <input
        type="email"
        bind:value={email}
        required
        autocomplete="email"
      />
    </label>

    <label class="field">
      <span class="label">Contraseña</span>
      <input
        type="password"
        bind:value={password}
        required
        autocomplete="current-password"
      />
    </label>

    <button type="submit" class="submit" disabled={loading}>
      {loading ? "..." : "Ingresar"}
    </button>

    <div class="divider">
      <span>o</span>
    </div>

    <button
      type="button"
      class="google"
      onclick={handle_google_login}
    >
      Ingresar con Google
    </button>
  </form>
</div>

<style>
  .page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: var(--bg);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 320px;
  }

  .title {
    font-size: 20px;
    font-weight: 600;
    text-align: center;
    margin: 0 0 8px;
    color: var(--text);
  }

  .error {
    margin: 0;
    padding: 8px 12px;
    font-size: 13px;
    color: var(--error);
    background: var(--error-subtle);
    border-radius: 6px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .label {
    font-size: 13px;
    color: var(--text-secondary);
  }

  input {
    padding: 8px 12px;
    font-size: 14px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--text);
  }

  input:focus {
    outline: 2px solid var(--log);
    outline-offset: -1px;
    border-color: transparent;
  }

  .submit {
    padding: 10px;
    font-size: 14px;
    font-weight: 500;
    border: none;
    border-radius: 6px;
    background: var(--neutral-900);
    color: var(--neutral-0);
    cursor: pointer;
    margin-top: 4px;
  }

  .submit:hover {
    opacity: 0.85;
  }

  .submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-muted);
    font-size: 13px;
  }

  .divider::before,
  .divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .google {
    padding: 10px;
    font-size: 14px;
    font-weight: 500;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
  }

  .google:hover {
    background: var(--hover-bg);
  }
</style>
