<script lang="ts">
  import "$lib/styles/styles.css"
  import favicon from "$lib/assets/favicon.svg"

  let { children }: { children: import("svelte").Snippet } =
    $props()
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
