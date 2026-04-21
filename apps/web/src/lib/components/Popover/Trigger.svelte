<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    id: string
    children: Snippet
    href?: string
  }

  let { id, children, href }: Props = $props()
</script>

{#if href}
  <a {href} class="trigger">
    {@render children()}
  </a>
{:else}
  <button
    type="button"
    class="trigger"
    popovertarget={id}
    style:anchor-name={`--${id}`}
  >
    {@render children()}
  </button>
{/if}

<style>
  .trigger {
    display: flex;
    align-items: center;
    gap: var(--dimension-spacing-2);
    padding: var(--dimension-spacing-2);
    width: 100%;
    background-color: var(--popover-bg-default);
    border: none;
    border-radius: var(--dimension-radius-lg);
    color: var(--popover-fg-default);
    cursor: pointer;
    text-decoration: none;
    transition: background-color 0.15s ease;
  }

  a.trigger {
    width: fit-content;
  }

  .trigger:hover {
    background-color: var(--popover-bg-hover);
  }
</style>
