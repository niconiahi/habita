<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()
</script>

<li>
  <span aria-current="page" class="current">
    {@render children()}
  </span>
</li>

<style>
  .current {
    color: var(--color-text-body);
  }
</style>
