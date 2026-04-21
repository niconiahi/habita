<script lang="ts">
  import type { Snippet } from "svelte"
  import type { HTMLButtonAttributes } from "svelte/elements"
  import { haptic } from "$lib/haptic"

  interface Props extends HTMLButtonAttributes {
    children: Snippet
    variant?: "primary" | "secondary" | "tertiary"
    squared?: boolean
  }

  let {
    children,
    variant,
    squared = false,
    class: className,
    ...rest
  }: Props = $props()

  const class_name = $derived(
    `button body-md-bold ${variant ?? ""} ${squared ? "squared" : ""} ${className ?? ""}`.trim(),
  )
</script>

<button use:haptic class={class_name} {...rest}>
  {@render children()}
</button>
