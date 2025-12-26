<script lang="ts">
  import { enhance } from "$app/forms"
  import type { Snippet } from "svelte"
  import type { HTMLFormAttributes } from "svelte/elements"

  interface Props extends HTMLFormAttributes {
    children: Snippet
  }

  let { children, ...rest }: Props = $props()
</script>

<form class="formulary" use:enhance {...rest}>
  {@render children()}
</form>

<style>
  .formulary {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }
</style>
