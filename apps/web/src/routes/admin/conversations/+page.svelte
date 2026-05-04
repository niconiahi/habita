<script lang="ts">
  import { enhance } from "$app/forms"
  import { page } from "$app/state"
  import * as Content from "$lib/components/Content"
  import Button from "$lib/components/Button.svelte"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  let reply_input = $state("")
  let is_sending = $state(false)

  const selected_id = $derived(
    page.url.searchParams.get("selected"),
  )

  function format_timestamp(value: string | Date): string {
    const date =
      value instanceof Date ? value : new Date(value)
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
</script>

<Content.Root label="Conversaciones">
  <Content.Title>Conversaciones</Content.Title>
  <Content.Section>
    <div class="layout">
      <div class="list">
        {#if data.conversations.length === 0}
          <p class="body-md-medium empty">
            No hay conversaciones aún.
          </p>
        {:else}
          {#each data.conversations as conversation (conversation.id)}
            <a
              href="?selected={conversation.id}"
              class="conversation-item"
              class:active={selected_id ===
                String(conversation.id)}
            >
              <span class="body-md-bold email">
                {conversation.user_email}
              </span>
              <span class="body-xs timestamp">
                {format_timestamp(conversation.updated_at)}
              </span>
            </a>
          {/each}
        {/if}
      </div>

      <div class="detail">
        {#if !selected_id}
          <div class="detail-empty">
            <p class="body-md-medium">
              Seleccioná una conversación para ver los
              mensajes.
            </p>
          </div>
        {:else}
          <div class="messages">
            {#each data.selected_messages as msg (msg.id)}
              {@const is_user =
                msg.user_id ===
                data.selected_conversation_user_id}
              <div
                class="message"
                class:from-user={is_user}
                class:from-admin={!is_user}
              >
                <span class="body-sm-medium sender">
                  {is_user ? "Usuario" : "Admin"}
                </span>
                <p class="body-md-medium content">
                  {msg.message}
                </p>
                <span class="body-xs msg-timestamp">
                  {format_timestamp(msg.created_at)}
                </span>
              </div>
            {/each}
          </div>

          <form
            class="reply-area"
            method="POST"
            action={compose_action(
              ACTION.CREATE_CONVERSATION_REPLY,
            )}
            use:enhance={() => {
              is_sending = true
              return async ({ update }) => {
                reply_input = ""
                is_sending = false
                await update()
              }
            }}
          >
            <input
              type="hidden"
              name="conversation_id"
              value={selected_id}
            />
            <textarea
              class="textarea"
              name="message"
              placeholder="Escribí tu respuesta..."
              bind:value={reply_input}
              disabled={is_sending}
              rows="3"
            ></textarea>
            <Button
              variant="primary"
              type="submit"
              disabled={is_sending || !reply_input.trim()}
            >
              Responder
            </Button>
          </form>
        {/if}
      </div>
    </div>
  </Content.Section>
</Content.Root>

<style>
  .layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: var(--dimension-spacing-4);
    min-height: 500px;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-1);
    border-right: 1px solid var(--color-border-primary);
    padding-right: var(--dimension-spacing-4);
    overflow-y: auto;
    max-height: 600px;
  }

  .empty {
    color: var(--color-neutrals-400);
    padding: var(--dimension-spacing-4);
  }

  .conversation-item {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-1);
    padding: var(--dimension-spacing-3);
    border-radius: var(--dimension-radius-default);
    text-decoration: none;
    color: var(--color-text-body);
    transition: background-color 0.15s ease;
  }

  .conversation-item:hover {
    background-color: var(--color-neutrals-50);
  }

  .conversation-item.active {
    background-color: var(--color-neutrals-100);
  }

  .email {
    color: var(--color-text-heading);
  }

  .timestamp {
    color: var(--color-neutrals-400);
  }

  .detail {
    display: flex;
    flex-direction: column;
  }

  .detail-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: var(--color-neutrals-400);
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-3);
    padding: var(--dimension-spacing-4);
    max-height: 450px;
  }

  .message {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-1);
    max-width: 80%;
  }

  .from-user {
    align-self: flex-start;
  }

  .from-admin {
    align-self: flex-end;
  }

  .sender {
    color: var(--color-neutrals-400);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .from-admin .sender {
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
    background-color: var(--color-neutrals-100);
    color: var(--color-text-body);
  }

  .from-admin .content {
    background-color: var(--color-blue-500);
    color: var(--color-neutrals-0);
  }

  .msg-timestamp {
    color: var(--color-neutrals-300);
  }

  .from-admin .msg-timestamp {
    text-align: right;
  }

  .reply-area {
    display: flex;
    gap: var(--dimension-spacing-2);
    padding: var(--dimension-spacing-4);
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
