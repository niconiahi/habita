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
      const response = await fetch("/chat", {
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
    <span class="body-sm-medium role">
      {message.role === "user" ? "Vos" : "Habita"}
    </span>
    <p class="body-md-medium content">{message.content}</p>
  </div>
{/snippet}

{#snippet EmptyState()}
  <div class="empty">
    <p class="heading-md empty-title">
      Preguntá sobre Habita
    </p>
    <p class="body-md-medium empty-hint">
      Podés preguntar qué puede hacer la plataforma, cómo
      funciona para inquilinos, administradores,
      inmobiliarias, o propietarios.
    </p>
  </div>
{/snippet}

<Content.Root label="Chat">
  <Content.Title>Chat</Content.Title>
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
        variant="primary"
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
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-lg);
    overflow: hidden;
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--dimension-spacing-6);
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
  }

  .message {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-1);
    max-width: 80%;
  }

  .user {
    align-self: flex-end;
  }

  .assistant {
    align-self: flex-start;
  }

  .role {
    color: var(--color-neutrals-400);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .user .role {
    text-align: right;
  }

  .content {
    padding: var(--dimension-spacing-2-5)
      var(--dimension-spacing-3-5);
    border-radius: var(--dimension-radius-lg);
    line-height: 1.5;
    white-space: pre-wrap;
  }

  .user .content {
    background-color: var(--color-blue-500);
    color: var(--color-neutrals-0);
  }

  .assistant .content {
    background-color: var(--color-neutrals-100);
    color: var(--color-text-body);
  }

  .empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--dimension-spacing-2);
    color: var(--color-neutrals-400);
  }

  .empty-title {
    color: var(--color-text-heading);
  }

  .empty-hint {
    text-align: center;
    max-width: 400px;
    color: var(--color-text-body);
  }

  .input-area {
    display: flex;
    gap: var(--dimension-spacing-2);
    padding: var(--dimension-spacing-3);
    border-top: 1px solid var(--color-border-primary);
  }

  .input {
    flex: 1;
    padding: var(--dimension-spacing-2-5)
      var(--dimension-spacing-3-5);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-lg);
    background-color: var(--color-neutrals-50);
    color: var(--color-text-heading);
  }

  .input::placeholder {
    color: var(--color-neutrals-300);
  }

  .input:focus-visible {
    outline: var(--focus-ring-width) solid
      var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  .input:disabled {
    opacity: 0.5;
  }
</style>
