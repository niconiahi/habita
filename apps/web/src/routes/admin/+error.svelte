<script lang="ts">
  import { page } from "$app/state"
  import { goto } from "$app/navigation"

  if (page.status === 403) {
    goto("/admin/properties", { replaceState: true })
  }
</script>

{#if page.status !== 403}
  <h1>{page.status}</h1>
  <p>{page.error?.message}</p>
{/if}
