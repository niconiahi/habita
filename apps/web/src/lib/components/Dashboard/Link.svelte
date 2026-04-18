<script lang="ts">
  import { page } from "$app/state"
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
    href: string
  }

  let { children, href }: Props = $props()
  let is_active = $derived(
    page.url.pathname.startsWith(href),
  )
</script>

<li>
  <a {href} aria-current={is_active ? "page" : undefined}>
    {@render children()}
  </a>
</li>

<style>
  a {
    display: flex;
    align-items: center;
    gap: var(--dimension-spacing-2);
    max-width: 100%;
    padding: var(--dimension-spacing-2);
    border-radius: var(--dimension-radius-lg);
    background: transparent;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  a:hover {
    background-color: var(--color-neutrals-150);
  }
  a[aria-current="page"] {
    background-color: var(--color-neutrals-200);
  }
</style>
