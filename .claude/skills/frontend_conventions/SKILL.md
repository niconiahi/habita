---
name: frontend_conventions
description: Frontend UI conventions. Use when implementing dialogs, modals, or other interactive UI patterns.
---

# Dialogs

Always use the native HTML `<dialog>` element with `.showModal()` / `.close()`. No custom modal implementations, no portals, no visibility toggling with CSS.

## Pattern

```svelte
<script lang="ts">
  let dialog_element: HTMLDialogElement | undefined = $state()

  function handle_open() {
    dialog_element?.showModal()
  }

  function handle_close() {
    dialog_element?.close()
  }

  function handle_backdrop_click(event: MouseEvent) {
    if (event.target === dialog_element) {
      handle_close()
    }
  }
</script>

<button type="button" onclick={handle_open}>Open</button>

<dialog
  bind:this={dialog_element}
  onclick={handle_backdrop_click}
>
  <div class="content">
    <button type="button" onclick={handle_close} aria-label="Cerrar">✕</button>
    <!-- dialog content -->
  </div>
</dialog>
```

## Rules

- Open with `.showModal()` (not `.show()`) — this creates the backdrop and traps focus
- Close with `.close()` — resets focus to the trigger element
- Backdrop click closes via comparing `event.target === dialog_element`
- The `<dialog>` itself has no padding/background — a `.content` div inside handles the visual card
- Style the backdrop with `dialog::backdrop`
