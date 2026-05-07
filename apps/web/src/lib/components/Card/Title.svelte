<script lang="ts">
  import type { Snippet } from "svelte"
  import type { HTMLAttributes } from "svelte/elements"

  interface Props extends HTMLAttributes<HTMLHeadingElement> {
    children: Snippet
  }

  let { children, ...rest }: Props = $props()
</script>

<h3 class="body-md-bold" {...rest}>
  {@render children()}
</h3>
