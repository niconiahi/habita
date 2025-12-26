<script lang="ts">
  import type { Snippet } from "svelte"

  let {
    children,
    header = false,
  }: { children: Snippet; header?: boolean } = $props()
</script>

{#if header}
  <th>
    {@render children()}
  </th>
{:else}
  <td>
    {@render children()}
  </td>
{/if}
