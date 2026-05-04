<script lang="ts">
  import { onMount } from "svelte"
  import Button from "$lib/components/Button.svelte"
  import * as Popover from "$lib/components/Popover"
  import Sparkles from "$icon/Sparkles.svelte"
  import ChatBubble from "$icon/ChatBubble.svelte"
  import AiChatPanel from "./AiChatPanel.svelte"
  import ConversationPanel from "./ConversationPanel.svelte"

  interface Props {
    is_authenticated: boolean
  }

  let { is_authenticated }: Props = $props()

  let ai_panel: AiChatPanel | undefined = $state(undefined)
  let conversation_panel: ConversationPanel | undefined =
    $state(undefined)

  let active_panel = $state<"ai" | "conversation" | null>(
    null,
  )

  function handle_ai_click() {
    ai_panel?.initialize()
  }

  function handle_conversation_click() {
    conversation_panel?.initialize()
  }

  onMount(() => {
    const ai = document.getElementById("ai-chat-popover")
    const conversation = document.getElementById(
      "conversation-popover",
    )

    function handle_ai_toggle(event: Event) {
      const toggle_event = event as ToggleEvent
      active_panel =
        toggle_event.newState === "open" ? "ai" : null
    }

    function handle_conversation_toggle(event: Event) {
      const toggle_event = event as ToggleEvent
      active_panel =
        toggle_event.newState === "open"
          ? "conversation"
          : null
    }

    ai?.addEventListener("toggle", handle_ai_toggle)
    conversation?.addEventListener(
      "toggle",
      handle_conversation_toggle,
    )

    return () => {
      ai?.removeEventListener("toggle", handle_ai_toggle)
      conversation?.removeEventListener(
        "toggle",
        handle_conversation_toggle,
      )
    }
  })
</script>

<div class="widget">
  <div class="triggers">
    <Popover.Root id="ai-chat-popover">
      <Button
        variant="tertiary"
        class="trigger {active_panel === 'ai'
          ? 'active'
          : ''}"
        popovertarget="ai-chat-popover"
        style="anchor-name: --ai-chat-popover"
        onclick={handle_ai_click}
      >
        <Sparkles />
        Preguntá a Habita
      </Button>
      <Popover.Content
        id="ai-chat-popover"
        position="top-left"
      >
        {#snippet children({ close })}
          <div class="panel-wrapper">
            <div class="panel-close">
              <button
                type="button"
                class="close-button"
                onclick={close}
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>
            <AiChatPanel bind:this={ai_panel} />
          </div>
        {/snippet}
      </Popover.Content>
    </Popover.Root>

    <Popover.Root id="conversation-popover">
      <Button
        variant="tertiary"
        class="trigger {active_panel === 'conversation'
          ? 'active'
          : ''}"
        popovertarget="conversation-popover"
        style="anchor-name: --conversation-popover"
        onclick={handle_conversation_click}
      >
        <ChatBubble />
        Hablá con el equipo
      </Button>
      <Popover.Content
        id="conversation-popover"
        position="top-left"
      >
        {#snippet children({ close })}
          <div class="panel-wrapper">
            <div class="panel-close">
              <button
                type="button"
                class="close-button"
                onclick={close}
                aria-label="Cerrar"
              >
                &times;
              </button>
            </div>
            <ConversationPanel
              bind:this={conversation_panel}
              {is_authenticated}
            />
          </div>
        {/snippet}
      </Popover.Content>
    </Popover.Root>
  </div>
</div>

<style>
  .widget {
    position: sticky;
    bottom: 0;
    z-index: 50;
    display: flex;
    justify-content: center;
    padding: var(--dimension-spacing-2);
    background-color: var(--color-neutrals-50);
    border-top: 1px solid var(--color-border-primary);
  }

  .triggers {
    display: flex;
    justify-content: flex-end;
    gap: var(--dimension-spacing-1);
    width: 100%;
    max-width: var(--dimension-screen-lg);
  }

  .triggers :global(.trigger) {
    height: var(--dimension-spacing-8);
  }

  .triggers :global(.trigger.active) {
    background-color: var(--color-neutrals-200);
  }

  .panel-wrapper {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-close {
    display: flex;
    justify-content: flex-end;
    padding: var(--dimension-spacing-1);
  }

  .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: var(--dimension-radius-default);
    background-color: transparent;
    color: var(--color-neutrals-400);
    font-size: 1.25rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .close-button:hover {
    background-color: var(--color-neutrals-100);
  }

  .close-button:focus-visible {
    outline: var(--focus-ring-width) solid
      var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }
</style>
