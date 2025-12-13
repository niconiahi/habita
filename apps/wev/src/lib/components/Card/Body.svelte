<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children: Snippet;
  }

  let { children, class: className, ...rest }: Props = $props();
</script>

<div class="body" {...rest}>
  {@render children()}
</div>

<style>
  .body {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto 1fr;
    padding: var(--spacing-4) var(--spacing-6);
    gap: var(--spacing-2);
    align-items: center;
  }
</style>
