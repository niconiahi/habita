<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    element?: HTMLDialogElement
    children: Snippet<[{ close: () => void }]>
  }

  let { element = $bindable(), children }: Props = $props()

  function handle_backdrop_click(event: MouseEvent) {
    if (event.target === element) {
      element?.close()
    }
  }
</script>

<dialog
  bind:this={element}
  class="dialog"
  onclick={handle_backdrop_click}
>
  {@render children({ close: () => element?.close() })}
</dialog>

<style>
  .dialog {
    border: none;
    padding: 0;
    background: transparent;
    max-width: min(90vw, 32rem);
    width: 100%;
    overflow: visible;
  }

  .dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.4);
  }

  .dialog[open] {
    margin: auto;
  }
</style>
