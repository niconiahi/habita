<script lang="ts">
  import * as Content from "$lib/components/Content"
  import Button from "$lib/components/Button.svelte"

  type Message = {
    role: "user" | "assistant"
    content: string
  }

  let messages = $state<Message[]>([])
  let input = $state("")
  let is_loading = $state(false)
  let messages_container: HTMLElement | undefined =
    $state(undefined)

  function scroll_to_bottom() {
    if (messages_container) {
      messages_container.scrollTop =
        messages_container.scrollHeight
    }
  }

  async function handle_submit(event: SubmitEvent) {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || is_loading) return

    const user_message: Message = {
      role: "user",
      content: trimmed,
    }
    messages = [...messages, user_message]
    input = ""
    is_loading = true

    const assistant_message: Message = {
      role: "assistant",
      content: "",
    }
    messages = [...messages, assistant_message]

    requestAnimationFrame(scroll_to_bottom)

    try {
      const response = await fetch("/chat/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages
            .filter((message) => message.content.length > 0)
            .map((message) => ({
              role: message.role,
              content: message.content,
            })),
        }),
      })

      if (!response.ok || !response.body) {
        assistant_message.content =
          "Lo siento, hubo un error. Intentá de nuevo."
        messages = [
          ...messages.slice(0, -1),
          assistant_message,
        ]
        is_loading = false
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistant_message.content += decoder.decode(value, {
          stream: true,
        })
        messages = [
          ...messages.slice(0, -1),
          { ...assistant_message },
        ]
        requestAnimationFrame(scroll_to_bottom)
      }
    } catch {
      assistant_message.content =
        "Lo siento, hubo un error de conexión. Intentá de nuevo."
      messages = [
        ...messages.slice(0, -1),
        assistant_message,
      ]
    }

    is_loading = false
  }
</script>

{#snippet MessageBubble(message: Message)}
  <div
    class="message"
    class:user={message.role === "user"}
    class:assistant={message.role === "assistant"}
  >
    <span class="role">
      {message.role === "user" ? "Vos" : "Habita"}
    </span>
    <p class="content">{message.content}</p>
  </div>
{/snippet}

{#snippet EmptyState()}
  <div class="empty">
    <p class="empty-title">Chat interno</p>
    <p class="empty-hint">
      Preguntá sobre cualquier aspecto técnico de la
      plataforma: rutas, acciones, autenticación, base de
      datos, broker, o firma digital.
    </p>
  </div>
{/snippet}

<Content.Root label="Chat (interno)">
  <Content.Title>Chat (interno)</Content.Title>
  <div class="chat-container">
    <div class="messages" bind:this={messages_container}>
      {#if messages.length === 0}
        {@render EmptyState()}
      {:else}
        {#each messages as message, index (index)}
          {@render MessageBubble(message)}
        {/each}
      {/if}
    </div>
    <form class="input-area" onsubmit={handle_submit}>
      <input
        class="input"
        type="text"
        placeholder="Escribí tu pregunta..."
        bind:value={input}
        disabled={is_loading}
        autocomplete="off"
      />
      <Button
        type="submit"
        disabled={is_loading || !input.trim()}
      >
        {is_loading ? "..." : "Enviar"}
      </Button>
    </form>
  </div>
</Content.Root>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    border: 2px solid var(--gray-400);
    border-radius: 0.25rem;
    overflow: hidden;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-4);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .message {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    max-width: 80%;
  }

  .user {
    align-self: flex-end;
  }

  .assistant {
    align-self: flex-start;
  }

  .role {
    font-size: 0.75rem;
    color: var(--gray-300);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .user .role {
    text-align: right;
  }

  .content {
    padding: var(--spacing-3) var(--spacing-4);
    border-radius: 0.25rem;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .user .content {
    background-color: var(--accent);
    color: var(--gray-700);
  }

  .assistant .content {
    background-color: var(--gray-600);
    color: var(--gray-100);
  }

  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-2);
    color: var(--gray-300);
  }

  .empty-title {
    font-size: 1.25rem;
    color: var(--gray-100);
  }

  .empty-hint {
    font-size: 0.875rem;
    text-align: center;
    max-width: 400px;
  }

  .input-area {
    display: flex;
    gap: var(--spacing-2);
    padding: var(--spacing-3);
    border-top: 2px solid var(--gray-400);
  }

  .input {
    flex: 1;
    padding: var(--spacing-2) var(--spacing-3);
    border: 2px solid var(--gray-400);
    border-radius: 0.25rem;
    background-color: var(--gray-700);
    color: var(--gray-100);
  }

  .input::placeholder {
    color: var(--gray-400);
  }

  .input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .input:disabled {
    opacity: 0.5;
  }
</style>
