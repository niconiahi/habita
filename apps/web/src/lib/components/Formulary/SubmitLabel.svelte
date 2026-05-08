<script lang="ts">
  type SubmitState = "idle" | "busy" | "done" | "error"

  interface Props {
    state: SubmitState
    idle: string
    busy: string
    done: string
    error: string
  }

  let { state, idle, busy, done, error }: Props = $props()
</script>

<span class="stack">
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
  <span
    class="label error"
    class:hidden={state !== "error"}
    aria-hidden={state !== "error"}
  >
    {error} ✕
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
  .error {
    color: var(--button-primary-fg-hover);
  }
</style>
