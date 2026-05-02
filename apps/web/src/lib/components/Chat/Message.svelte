<script lang="ts">
  type Props = {
    role: "user" | "assistant"
    content: string
  }

  let { role, content }: Props = $props()
</script>

{#if content.length > 0}
  <div
    class="message"
    class:user={role === "user"}
    class:assistant={role === "assistant"}
  >
    <span class="body-sm-medium role">
      {role === "user" ? "Vos" : "Habita"}
    </span>
    {#if role === "assistant"}
      <div class="content markdown">
        {@html content}
      </div>
    {:else}
      <p class="body-md-medium content">{content}</p>
    {/if}
  </div>
{/if}

<style>
  .message {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-1);
    max-width: 85%;
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
  }

  .user .content {
    background-color: var(--color-blue-500);
    color: var(--color-neutrals-0);
    white-space: pre-wrap;
  }

  .assistant .content {
    background-color: var(--color-neutrals-100);
    color: var(--color-text-body);
  }
</style>
