<script lang="ts">
  import type { Snippet } from "svelte"

  let {
    children,
    header = false,
  }: { children?: Snippet; header?: boolean } = $props()
</script>

{#if header}
  <th class="body-sm-bold">
    {@render children?.()}
  </th>
{:else}
  <td class="body-md-medium">
    {@render children?.()}
  </td>
{/if}
