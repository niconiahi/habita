<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<h1>
  {@render children()}
</h1>

<style>
  h1 {
    min-height: 36px;
    font-size: var(--spacing-10);
  }
</style>
