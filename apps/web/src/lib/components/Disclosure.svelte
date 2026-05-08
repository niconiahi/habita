<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    title: string
    open?: boolean
    name?: string
    ontoggle?: (event: Event) => void
    children: Snippet
  }

  let {
    title,
    open = false,
    name,
    ontoggle,
    children,
  }: Props = $props()
</script>

<details class="disclosure" {open} {name} {ontoggle}>
  <summary class="body-md-bold header">
    <span>{title}</span>
    <svg
      class="chevron"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </summary>
  <div class="content">
    {@render children()}
  </div>
</details>

<style>
  .disclosure {
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-lg);
    interpolate-size: allow-keywords;
  }

  .disclosure::details-content {
    height: 0;
    overflow: clip;
    transition:
      height 200ms ease-out,
      content-visibility 200ms ease-out allow-discrete;
  }

  .disclosure[open]::details-content {
    height: auto;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--dimension-spacing-3)
      var(--dimension-spacing-4);
    cursor: pointer;
    color: var(--color-text-heading);
    list-style: none;
  }

  .header::-webkit-details-marker {
    display: none;
  }

  .header::marker {
    display: none;
    content: "";
  }

  .chevron {
    transition: transform 0.2s ease;
    color: var(--color-text-body);
  }

  .disclosure[open] .chevron {
    transform: rotate(180deg);
  }

  .content {
    padding: 0 var(--dimension-spacing-4)
      var(--dimension-spacing-4);
  }
</style>
