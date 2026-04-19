<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()
</script>

<nav aria-label="breadcrumb" class="breadcrumb">
  <ol class="body-sm-medium list">
    {@render children()}
  </ol>
</nav>

<style>
  .list {
    display: flex;
    align-items: center;
    gap: var(--dimension-spacing-1);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .list :global(li + li::before) {
    content: ">";
    margin-right: var(--dimension-spacing-1);
    color: var(--color-text-body);
  }
</style>
