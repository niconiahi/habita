<script lang="ts">
  import { enhance } from "$app/forms"
  import type { Snippet } from "svelte"
  import type { HTMLFormAttributes } from "svelte/elements"

  const MIN_BUSY_DURATION_MS = 400
  const TERMINAL_DURATION_MS = 1500

  type SubmitState = "idle" | "busy" | "done"

  interface Props
    extends Omit<HTMLFormAttributes, "children"> {
    children: Snippet<[{ submit_state: SubmitState }]>
  }

  let { children, ...rest }: Props = $props()

  let submit_state = $state<SubmitState>("idle")
  let started_at: number | null = null
  let revert_timer: ReturnType<typeof setTimeout> | null =
    null

  function clear_revert_timer() {
    if (revert_timer) {
      clearTimeout(revert_timer)
      revert_timer = null
    }
  }

  const live_message = $derived.by(() => {
    if (submit_state === "busy") return "Enviando"
    if (submit_state === "done") return "Guardado"
    return ""
  })
</script>

<form
  class="formulary"
  data-sveltekit-noscroll
  aria-busy={submit_state === "busy"}
  use:enhance={() => {
    clear_revert_timer()
    submit_state = "busy"
    started_at = Date.now()
    return async ({ update, result }) => {
      await update({ reset: false })
      if (started_at !== null) {
        const remaining =
          MIN_BUSY_DURATION_MS - (Date.now() - started_at)
        if (remaining > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, remaining),
          )
        }
      }
      const succeeded =
        result.type === "success" ||
        result.type === "redirect"
      submit_state = succeeded ? "done" : "idle"
      if (succeeded) {
        revert_timer = setTimeout(() => {
          submit_state = "idle"
          revert_timer = null
        }, TERMINAL_DURATION_MS)
      }
      started_at = null
    }
  }}
  {...rest}
>
  <span aria-live="polite" class="sr-only">
    {live_message}
  </span>
  {@render children({ submit_state })}
</form>

<style>
  .formulary {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
