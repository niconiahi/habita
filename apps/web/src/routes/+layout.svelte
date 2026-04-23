<script lang="ts">
  import "$lib/styles/styles.css"
  import favicon from "$lib/assets/favicon.svg"
  import { haptic_global } from "$lib/haptic"
  import { onMount } from "svelte"

  let { children }: { children: import("svelte").Snippet } =
    $props()

  onMount(() => haptic_global())
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
