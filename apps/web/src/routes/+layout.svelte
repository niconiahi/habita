<script lang="ts">
  import "$lib/styles/styles.css"
  import favicon from "$lib/assets/favicon.svg"
  import Header from "$lib/components/Header.svelte"
  import type { LayoutData } from "./$types"

  let {
    children,
    data,
  }: {
    children: import("svelte").Snippet
    data: LayoutData
  } = $props()
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<Header user={data.user} notifications={data.notifications} />
{@render children()}
