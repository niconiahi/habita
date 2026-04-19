<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()
</script>

<h2 class="heading-sm title">
  {@render children()}
</h2>

<style>
  .title {
    color: var(--color-text-heading);
  }
</style>
