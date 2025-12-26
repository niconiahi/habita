<script lang="ts">
  import type { Snippet } from "svelte"
  import type { HTMLButtonAttributes } from "svelte/elements"

  interface Props extends HTMLButtonAttributes {
    children: Snippet
  }

  let {
    children,
    class: className,
    ...rest
  }: Props = $props()

  const class_name = $derived(
    className ? `button ${className}` : "button",
  )
</script>

<button class={class_name} {...rest}>
  {@render children()}
</button>
