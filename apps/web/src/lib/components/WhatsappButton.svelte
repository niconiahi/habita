<script lang="ts">
  import type { Snippet } from "svelte"
  import Whatsapp from "$icon/Whatsapp.svelte"

  interface Props {
    phone_number: string
    children: Snippet
  }

  let { phone_number, children }: Props = $props()
</script>

<a
  class="whatsapp-button"
  href="https://wa.me/{phone_number.replace('+', '')}"
  target="_blank"
  rel="noopener noreferrer"
>
  <span class="icon">
    <Whatsapp />
  </span>
  {@render children()}
</a>

<style>
  .whatsapp-button {
    display: inline-flex;
    align-items: center;
    gap: var(--dimension-spacing-2);
    color: white;
    background-color: #25d366;
    padding: var(--dimension-spacing-2) var(--dimension-spacing-4);
    border-radius: var(--dimension-radius-default);
    font-weight: 700;
    text-decoration: none;
  }

  .whatsapp-button:hover {
    background-color: #1da851;
  }

  .icon {
    display: flex;
    width: 18px;
    height: 18px;
  }

  .icon :global(svg) {
    width: 100%;
    height: 100%;
  }
</style>
