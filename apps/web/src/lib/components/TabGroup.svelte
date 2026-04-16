<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()
</script>

<div class="tab-group">
  {@render children()}
</div>

<style>
  .tab-group {
    display: flex;
    align-items: flex-start;
    overflow: clip;
  }
</style>
