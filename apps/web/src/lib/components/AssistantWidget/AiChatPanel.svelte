<script lang="ts">
  import * as v from "valibot"
  import Button from "$lib/components/Button.svelte"
  import * as Chat from "$lib/components/Chat"
  import * as Dialog from "$lib/components/Dialog"

  const StreamChunkSchema = v.variant("type", [
    v.object({
      type: v.literal("text"),
      content: v.string(),
    }),
    v.object({ type: v.literal("done") }),
    v.object({
      type: v.literal("error"),
      message: v.string(),
    }),
  ])

  const StoredEntrySchema = v.object({
    type: v.literal("message"),
    data: v.object({
      role: v.picklist(["user", "assistant"]),
      content: v.string(),
    }),
  })

  const StoredEntriesSchema = v.array(StoredEntrySchema)

  type ChatMessage = {
    role: "user" | "assistant"
    content: string
  }

  type ChatEntry = { type: "message"; data: ChatMessage }

  const HISTORY_KEY = "assistant_widget_chat_history"

  let entries = $state<ChatEntry[]>([])
  let input = $state("")
  let is_loading = $state(false)
  let messages_container: HTMLElement | undefined =
    $state(undefined)
  let reset_dialog_element: HTMLDialogElement | undefined =
    $state(undefined)

  function load_entries(): ChatEntry[] {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const validation = v.safeParse(
      StoredEntriesSchema,
      JSON.parse(raw),
    )
    if (!validation.success) return []
    return validation.output
  }

  function save_entries() {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(entries),
    )
  }

  function handle_reset() {
    entries = []
    localStorage.removeItem(HISTORY_KEY)
  }

  function scroll_to_bottom() {
    if (messages_container) {
      messages_container.scrollTop =
        messages_container.scrollHeight
    }
  }

  function get_messages(): ChatMessage[] {
    const messages: ChatMessage[] = []
    for (const entry of entries) {
      if (entry.data.content.length > 0) {
        messages.push(entry.data)
      }
    }
    return messages
  }

  function handle_submit(event: SubmitEvent) {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || is_loading) return
    input = ""
    submit_message(trimmed)
  }

  async function submit_message(content: string) {
    const previous_messages = get_messages()

    const user_message: ChatMessage = {
      role: "user",
      content,
    }
    entries = [
      ...entries,
      { type: "message", data: user_message },
    ]
    is_loading = true

    const assistant_message: ChatMessage = {
      role: "assistant",
      content: "",
    }
    entries = [
      ...entries,
      { type: "message", data: assistant_message },
    ]

    const messages_to_send = [
      ...previous_messages,
      {
        role: user_message.role,
        content: user_message.content,
      },
    ]

    requestAnimationFrame(scroll_to_bottom)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages_to_send,
        }),
      })

      if (!response.ok || !response.body) {
        const error_body = await response
          .json()
          .catch(() => null)
        assistant_message.content =
          error_body?.error ??
          "Lo siento, hubo un error. Intentá de nuevo."
        entries = [
          ...entries.slice(0, -1),
          {
            type: "message",
            data: { ...assistant_message },
          },
        ]
        save_entries()
        is_loading = false
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.trim()) continue
          const chunk_validation = v.safeParse(
            StreamChunkSchema,
            JSON.parse(line),
          )
          if (!chunk_validation.success) continue
          const chunk = chunk_validation.output

          if (chunk.type === "text") {
            assistant_message.content += chunk.content
            entries = [
              ...entries.slice(0, -1),
              {
                type: "message",
                data: { ...assistant_message },
              },
            ]
            requestAnimationFrame(scroll_to_bottom)
          } else if (chunk.type === "error") {
            assistant_message.content = chunk.message
            entries = [
              ...entries.slice(0, -1),
              {
                type: "message",
                data: { ...assistant_message },
              },
            ]
          }
        }
      }
    } catch {
      assistant_message.content =
        "Lo siento, hubo un error de conexión. Intentá de nuevo."
      entries = [
        ...entries.slice(0, -1),
        { type: "message", data: { ...assistant_message } },
      ]
    }

    save_entries()
    is_loading = false
  }

  export function initialize() {
    entries = load_entries()
    requestAnimationFrame(scroll_to_bottom)
  }
</script>

<div class="panel">
  <div class="panel-header">
    <span class="body-md-bold">Preguntá a Habita</span>
    <Button
      variant="tertiary"
      onclick={() => reset_dialog_element?.showModal()}
      disabled={entries.length === 0 || is_loading}
    >
      Nueva sesión
    </Button>
  </div>
  <Dialog.Root bind:element={reset_dialog_element}>
    {#snippet children({ close })}
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>¿Iniciar nueva sesión?</Dialog.Title
          >
          <Dialog.Close onclick={close} />
        </Dialog.Header>
        <p class="body-md-medium confirmation-text">
          Se va a borrar toda la conversación actual. Esta
          acción no se puede deshacer.
        </p>
        <Dialog.Actions>
          <Button
            variant="secondary"
            type="button"
            onclick={close}>Cancelar</Button
          >
          <Button
            variant="primary"
            type="button"
            onclick={() => {
              handle_reset()
              close()
            }}>Confirmar</Button
          >
        </Dialog.Actions>
      </Dialog.Content>
    {/snippet}
  </Dialog.Root>

  <div class="messages" bind:this={messages_container}>
    {#if entries.length === 0}
      <div class="empty">
        <p class="heading-sm empty-title">
          Preguntá sobre Habita
        </p>
        <p class="body-sm-medium empty-hint">
          Podés preguntar qué puede hacer la plataforma,
          cómo funciona para inquilinos, administradores,
          inmobiliarias, o propietarios.
        </p>
      </div>
    {:else}
      {#each entries as entry, index (index)}
        <Chat.Message
          role={entry.data.role}
          content={entry.data.content}
        />
      {/each}
      {#if is_loading}
        <div class="typing">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      {/if}
    {/if}
  </div>

  <form class="input-area" onsubmit={handle_submit}>
    <input
      class="input"
      type="text"
      placeholder="Escribí tu mensaje..."
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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--dimension-spacing-2);
    text-align: center;
  }

  .empty-title {
    color: var(--color-text-heading);
  }

  .empty-hint {
    color: var(--color-neutrals-400);
    max-width: 300px;
  }

  .input-area {
    display: flex;
    gap: var(--dimension-spacing-2);
    padding: var(--dimension-spacing-3)
      var(--dimension-spacing-4);
    border-top: 1px solid var(--color-border-primary);
  }

  .input {
    flex: 1;
    padding: var(--dimension-spacing-2)
      var(--dimension-spacing-3);
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

  .confirmation-text {
    color: var(--color-neutrals-500);
  }

  .typing {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: var(--dimension-spacing-2-5)
      var(--dimension-spacing-3-5);
    background-color: var(--color-neutrals-100);
    border-radius: var(--dimension-radius-lg);
    align-self: flex-start;
    width: fit-content;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--color-neutrals-400);
    animation: bounce 1.4s infinite ease-in-out both;
  }

  .dot:nth-child(1) {
    animation-delay: 0s;
  }

  .dot:nth-child(2) {
    animation-delay: 0.16s;
  }

  .dot:nth-child(3) {
    animation-delay: 0.32s;
  }

  @keyframes bounce {
    0%,
    80%,
    100% {
      transform: scale(0.6);
      opacity: 0.4;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
</style>
