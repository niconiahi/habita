<script lang="ts">
  import Footer from "$lib/components/Footer.svelte"
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

<Header is_manager={data.is_manager} user={data.user} />
<div class="container-centered">
  <div class="content">
    {@render children()}
  </div>
</div>
<Footer />

<style>
  .container-centered {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    min-height: 70vh;
    padding: var(--dimension-spacing-6) 0;
    background-color: var(--color-absolute-white);
    font-family: var(--font-family-body);
    color: var(--color-text-body);
  }

  .content {
    width: 100%;
    max-width: var(--dimension-screen-lg);
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .content
    :global(
      input:not([type="radio"]):not([type="checkbox"])
    ),
  .content :global(select),
  .content :global(textarea) {
    background-color: transparent;
    color: var(--color-text-body);
    border-color: var(--color-border-primary);
  }
</style>
