<script lang="ts">
  import type { Snippet } from "svelte"
  import type { HTMLLabelAttributes } from "svelte/elements"

  interface Props extends HTMLLabelAttributes {
    children: Snippet
  }

  let { children, ...rest }: Props = $props()
</script>

<label class="label" {...rest}>
  {@render children()}
</label>

<style>
  .label {
    color: var(--gray-100);
    display: block;
  }

  .label::first-letter {
    text-transform: uppercase;
  }
</style>
