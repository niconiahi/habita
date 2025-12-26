<script lang="ts">
  import type { Snippet } from "svelte"
  import type { HTMLLiAttributes } from "svelte/elements"

  interface Props extends HTMLLiAttributes {
    children: Snippet
  }

  let { children, ...rest }: Props = $props()
</script>

<li {...rest}>
  {@render children()}
</li>
