<script lang="ts" module>
  import { getContext, setContext } from "svelte"

  const FORMULARY_CONTEXT_KEY = Symbol("formulary")

  type FormularyContext = {
    is_submitting: () => boolean
  }

  export function get_formulary_context(): FormularyContext {
    return (
      getContext<FormularyContext>(FORMULARY_CONTEXT_KEY) ?? {
        is_submitting: () => false,
      }
    )
  }

  export function set_formulary_context(
    context: FormularyContext,
  ) {
    setContext(FORMULARY_CONTEXT_KEY, context)
  }
</script>

<script lang="ts">
  import { enhance } from "$app/forms"
  import type { Snippet } from "svelte"
  import type { HTMLFormAttributes } from "svelte/elements"

  interface Props extends HTMLFormAttributes {
    children: Snippet
  }

  let { children, ...rest }: Props = $props()

  let is_submitting = $state(false)

  set_formulary_context({
    is_submitting: () => is_submitting,
  })
</script>

<form
  class="formulary"
  data-sveltekit-noscroll
  use:enhance={() => {
    is_submitting = true
    return async ({ update }) => {
      await update({ reset: false })
      is_submitting = false
    }
  }}
  {...rest}
>
  {@render children()}
</form>

<style>
  .formulary {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }
</style>
