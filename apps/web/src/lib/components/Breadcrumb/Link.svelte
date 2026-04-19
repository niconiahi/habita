<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    href: string
    children: Snippet
  }

  let { href, children }: Props = $props()
</script>

<li>
  <a {href} class="link">
    {@render children()}
  </a>
</li>

<style>
  .link {
    font: inherit;
  }
</style>
