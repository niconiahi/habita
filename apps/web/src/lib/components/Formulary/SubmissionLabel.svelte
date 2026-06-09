<script lang="ts">
  interface Props {
    is_busy: boolean
    is_done: boolean
    idle: string
    busy: string
    done: string
  }

  let { is_busy, is_done, idle, busy, done }: Props =
    $props()

  const state = $derived(
    is_busy ? "busy" : is_done ? "done" : "idle",
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
  <span aria-live="polite" class="sr-only"
    >{live_message}</span
  >
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
    color: var(--color-secondary-fg);
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
