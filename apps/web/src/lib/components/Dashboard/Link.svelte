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
    gap: 0.5rem;
    max-width: 100%;
    padding: 0.5rem;
    border: none;
    border-radius: 0.375rem;
    background: transparent;
    color: var(--gray-100);
    font-size: 0.875rem;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }
  a:hover {
    background-color: #23221e;
  }
  a[aria-current="page"] {
    background-color: #615f55;
    font-weight: 500;
  }
  a:focus-visible {
    outline: 2px solid #171717;
    outline-offset: 2px;
  }
</style>
