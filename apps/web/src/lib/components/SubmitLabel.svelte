<script lang="ts">
  import { defer_changing } from "$lib/defer_changing.svelte"

  const MIN_BUSY_MS = 400
  const MIN_DONE_MS = 1500

  interface Form {
    pending: number
    result: { ok?: boolean } | undefined
  }

  interface Props {
    form: Form
    idle: string
    busy: string
    done: string
  }

  let { form, idle, busy, done }: Props = $props()

  const is_busy = defer_changing(
    () => form.pending > 0,
    MIN_BUSY_MS,
  )
  const is_done = defer_changing(
    () => form.pending === 0 && form.result?.ok === true,
    MIN_DONE_MS,
  )

  const state = $derived(
    is_busy() ? "busy" : is_done() ? "done" : "idle",
  )

  const live_message = $derived(
    state === "busy"
      ? "Enviando"
      : state === "done"
        ? "Guardado"
        : "",
  )
</script>

<span class="stack" aria-busy={state === "busy"}>
  <span aria-live="polite" class="sr-only">{live_message}</span>
  <span
    class="label"
    class:hidden={state !== "idle"}
    aria-hidden={state !== "idle"}
  >
    {idle}
  </span>
  <span
    class="label"
    class:hidden={state !== "busy"}
    aria-hidden={state !== "busy"}
  >
    {busy}
  </span>
  <span
    class="label done"
    class:hidden={state !== "done"}
    aria-hidden={state !== "done"}
  >
    {done} ✓
  </span>
</span>

<style>
  .stack {
    display: grid;
    grid-template-areas: "stack";
  }
  .label {
    grid-area: stack;
  }
  .hidden {
    visibility: hidden;
  }
  .done {
    color: var(--button-primary-fg-hover);
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
