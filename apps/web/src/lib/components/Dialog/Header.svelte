<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()
</script>

<div class="header">
  {@render children()}
</div>

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
