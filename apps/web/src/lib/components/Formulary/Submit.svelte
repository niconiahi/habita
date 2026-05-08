<script lang="ts">
  import type { Snippet } from "svelte"
  import type { HTMLButtonAttributes } from "svelte/elements"
  import Button from "$lib/components/Button.svelte"
  import { get_formulary_context } from "./Root.svelte"

  interface Props
    extends Omit<HTMLButtonAttributes, "type" | "disabled"> {
    children: Snippet
    variant?: "primary" | "secondary" | "tertiary"
    pending_label?: string
  }

  let {
    children,
    variant = "primary",
    pending_label = "Guardando...",
    ...rest
  }: Props = $props()

  const context = get_formulary_context()
  const is_submitting = $derived(context.is_submitting())
</script>

<Button
  {variant}
  type="submit"
  disabled={is_submitting}
  {...rest}
>
  {#if is_submitting}
    {pending_label}
  {:else}
    {@render children()}
  {/if}
</Button>
