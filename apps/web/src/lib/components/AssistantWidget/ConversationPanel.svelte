<script lang="ts">
  import Button from "$lib/components/Button.svelte"

  interface Props {
    is_authenticated: boolean
  }

  let { is_authenticated }: Props = $props()

  type ConversationMessage = {
    id: number
    user_id: number
    message: string
    created_at: string
  }

  type ConversationData = {
    conversation: { id: number; user_id: number } | null
    messages: ConversationMessage[]
  }

  let messages = $state<ConversationMessage[]>([])
  let conversation_user_id = $state<number | null>(null)
  let input = $state("")
  let is_loading = $state(false)
  let is_sending = $state(false)
  let messages_container: HTMLElement | undefined =
    $state(undefined)

  function scroll_to_bottom() {
    if (messages_container) {
      messages_container.scrollTop =
        messages_container.scrollHeight
    }
  }

  function format_timestamp(iso: string): string {
    const date = new Date(iso)
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  async function fetch_messages() {
    is_loading = true
    try {
      const response = await fetch("/api/conversations")
      if (response.ok) {
        const data: ConversationData = await response.json()
        messages = data.messages
        conversation_user_id =
          data.conversation?.user_id ?? null
        requestAnimationFrame(scroll_to_bottom)
      }
    } finally {
      is_loading = false
    }
  }

  async function handle_submit(event: SubmitEvent) {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || is_sending) return

    is_sending = true
    const message_text = trimmed
    input = ""

    try {
      const response = await fetch(
        "/api/conversations/message",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: message_text }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        messages = [...messages, data.message]
        requestAnimationFrame(scroll_to_bottom)
      }
    } finally {
      is_sending = false
    }
  }

  export function initialize() {
    if (is_authenticated) {
      fetch_messages()
    }
  }
</script>

<div class="panel">
  <div class="panel-header">
    <span class="body-md-bold">Hablá con el equipo</span>
  </div>

  {#if !is_authenticated}
    <div class="auth-gate">
      <p class="body-md-medium">
        Necesitás estar autenticado para hablar con nosotros.
      </p>
      <a href="/login" class="body-md-bold auth-link">
        Iniciá sesión
      </a>
    </div>
  {:else if is_loading}
    <div class="loading">
      <p class="body-sm-medium">Cargando mensajes...</p>
    </div>
  {:else}
    <div class="messages" bind:this={messages_container}>
      {#if messages.length === 0}
        <div class="empty">
          <p class="body-md-medium empty-hint">
            Escribinos lo que quieras — sugerencias, dudas,
            o lo que necesites. Te respondemos por acá y por
            email.
          </p>
        </div>
      {:else}
        {#each messages as msg (msg.id)}
          {@const is_user =
            msg.user_id === conversation_user_id}
          <div
            class="message"
            class:from-user={is_user}
            class:from-admin={!is_user}
          >
            <span class="body-sm-medium sender">
              {is_user ? "Vos" : "Habita"}
            </span>
            <p class="body-md-medium content">
              {msg.message}
            </p>
            <span class="body-xs timestamp">
              {format_timestamp(msg.created_at)}
            </span>
          </div>
        {/each}
      {/if}
    </div>

    <form class="input-area" onsubmit={handle_submit}>
      <textarea
        class="textarea"
        placeholder="Escribí tu mensaje..."
        bind:value={input}
        disabled={is_sending}
        rows="2"
      ></textarea>
      <Button
        variant="primary"
        type="submit"
        disabled={is_sending || !input.trim()}
      >
        Enviar
      </Button>
    </form>
  {/if}
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    width: 550px;
    max-height: 500px;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--dimension-spacing-3)
      var(--dimension-spacing-4);
    border-bottom: 1px solid var(--color-border-primary);
  }

  .auth-gate {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--dimension-spacing-3);
    padding: var(--dimension-spacing-8);
    text-align: center;
    color: var(--color-text-body);
  }

  .auth-link {
    color: var(--color-blue-500);
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--dimension-spacing-8);
    color: var(--color-neutrals-400);
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--dimension-spacing-4);
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-3);
    min-height: 300px;
  }

  .empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .empty-hint {
    color: var(--color-neutrals-400);
    max-width: 300px;
  }

  .message {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-1);
    max-width: 85%;
  }

  .from-user {
    align-self: flex-end;
  }

  .from-admin {
    align-self: flex-start;
  }

  .sender {
    color: var(--color-neutrals-400);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .from-user .sender {
    text-align: right;
  }

  .content {
    padding: var(--dimension-spacing-2-5)
      var(--dimension-spacing-3-5);
    border-radius: var(--dimension-radius-lg);
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .from-user .content {
    background-color: var(--color-blue-500);
    color: var(--color-neutrals-0);
  }

  .from-admin .content {
    background-color: var(--color-neutrals-100);
    color: var(--color-text-body);
  }

  .timestamp {
    color: var(--color-neutrals-300);
  }

  .from-user .timestamp {
    text-align: right;
  }

  .input-area {
    display: flex;
    gap: var(--dimension-spacing-2);
    padding: var(--dimension-spacing-3)
      var(--dimension-spacing-4);
    border-top: 1px solid var(--color-border-primary);
    align-items: flex-end;
  }

  .textarea {
    flex: 1;
    padding: var(--dimension-spacing-2)
      var(--dimension-spacing-3);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-lg);
    background-color: var(--color-neutrals-50);
    color: var(--color-text-heading);
    resize: none;
    font-family: inherit;
  }

  .textarea::placeholder {
    color: var(--color-neutrals-300);
  }

  .textarea:focus-visible {
    outline: var(--focus-ring-width) solid
      var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  .textarea:disabled {
    opacity: 0.5;
  }
</style>
