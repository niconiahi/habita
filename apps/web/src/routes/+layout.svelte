<script lang="ts">
  import "$lib/styles/styles.css"
  import favicon from "$lib/assets/favicon.svg"
  import Header from "$lib/components/Header.svelte"
  import SubscriptionBanner from "$lib/components/SubscriptionBanner.svelte"
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

<Header
  is_manager={data.is_manager}
  organizations={data.organizations}
  active_organization_id={data.active_organization_id}
/>
{#if data.subscription_grace}
  <SubscriptionBanner
    days_remaining={data.subscription_days_remaining}
  />
{/if}
{@render children()}
