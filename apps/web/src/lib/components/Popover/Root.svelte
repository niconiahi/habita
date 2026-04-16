<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    id: string
    children: Snippet
  }

  let { id, children }: Props = $props()
</script>

<div class="root" style:--popover-anchor-name={`--${id}`}>
  {@render children()}
</div>

<style>
  .root {
    position: relative;
  }
</style>
