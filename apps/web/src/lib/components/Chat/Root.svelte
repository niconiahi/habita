<script lang="ts">
  import * as v from "valibot"
  import { page } from "$app/state"
  import { onMount } from "svelte"
  import Button from "$lib/components/Button.svelte"
  import Message from "./Message.svelte"

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

  let entries = $state<ChatEntry[]>([])
  let input = $state("")
  let is_loading = $state(false)
  let messages_container: HTMLElement | undefined =
    $state(undefined)

  const history_key = $derived(
    `chat_history:${page.url.pathname}`,
  )

  onMount(() => {
    entries = load_entries()
    requestAnimationFrame(scroll_to_bottom)
  })

  function load_entries(): ChatEntry[] {
    const raw = localStorage.getItem(history_key)
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
      history_key,
      JSON.stringify(entries),
    )
  }

  function handle_reset() {
    entries = []
    localStorage.removeItem(history_key)
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
      const response = await fetch("", {
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
              ...entries.filter(
                (entry) =>
                  !(entry.data === assistant_message),
              ),
              {
                type: "message",
                data: { ...assistant_message },
              },
            ]
            requestAnimationFrame(scroll_to_bottom)
          } else if (chunk.type === "error") {
            assistant_message.content = chunk.message
            entries = [
              ...entries.filter(
                (entry) =>
                  !(entry.data === assistant_message),
              ),
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
        ...entries.filter(
          (entry) => !(entry.data === assistant_message),
        ),
        { type: "message", data: { ...assistant_message } },
      ]
    }

    save_entries()
    is_loading = false
  }
</script>

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

<div class="chat-container">
  <div class="chat-top">
    <div class="top-right">
      <Button
        variant="tertiary"
        onclick={handle_reset}
        disabled={entries.length === 0 || is_loading}
      >
        Nueva sesión
      </Button>
    </div>
  </div>

  <div class="messages" bind:this={messages_container}>
    {#if entries.length === 0}
      {@render EmptyState()}
    {:else}
      {#each entries as entry, index (index)}
        <Message
          role={entry.data.role}
          content={entry.data.content}
        />
      {/each}
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
  .chat-container {
    display: flex;
    flex-direction: column;
    min-height: 500px;
    max-height: 700px;
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-lg);
    overflow: hidden;
    background-color: var(--color-neutrals-0);
  }

  .chat-top {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--dimension-spacing-2);
    padding: var(--dimension-spacing-2)
      var(--dimension-spacing-4);
    border-bottom: 1px solid var(--color-border-primary);
  }

  .top-right {
    display: flex;
    gap: var(--dimension-spacing-2);
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--dimension-spacing-6);
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-3);
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
    max-width: 400px;
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
