<script lang="ts">
  import type { Snippet } from "svelte"
  import { defer_changing } from "$lib/defer_changing.svelte"

  const MIN_BUSY_MS = 400
  const DONE_DURATION_MS = 1500

  interface Form {
    pending: number
    result: { ok?: boolean } | undefined
  }

  interface Signals {
    is_busy: () => boolean
    is_done: () => boolean
  }

  let {
    form,
    children,
  }: {
    form: Form
    children: Snippet<[Signals]>
  } = $props()

  const is_busy = defer_changing(
    () => form.pending > 0,
    MIN_BUSY_MS,
  )

  let pending_pulse = $state(false)
  let pulse_until = $state(0)
  let last_result: Form["result"] = undefined
  let tick = $state(0)
  let timer: ReturnType<typeof setTimeout> | null = null

  $effect(() => {
    const result = form.result
    if (result !== last_result) {
      if (result?.ok === true) pending_pulse = true
      last_result = result
    }
  })

  $effect(() => {
    if (pending_pulse && !is_busy()) {
      pending_pulse = false
      pulse_until = Date.now() + DONE_DURATION_MS
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        tick++
      }, DONE_DURATION_MS)
    }
  })

  $effect(() => () => {
    if (timer) clearTimeout(timer)
  })

  const is_done = () => {
    void tick
    return Date.now() < pulse_until
  }
</script>

{@render children({ is_busy, is_done })}
