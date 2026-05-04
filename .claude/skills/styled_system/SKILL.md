---
name: styled_system
description: Reusable component library and global styles. Use always before creating custom UI — check here first to avoid duplicating existing components or global styles.
---

# Styled System

Before writing custom UI, check what already exists. These components and global styles handle common patterns across the app.

## Dialog

Use `$lib/components/Dialog` for all modal dialogs. Never create custom `<dialog>` implementations.

```svelte
<script lang="ts">
  import * as Dialog from "$lib/components/Dialog"

  let dialog_element: HTMLDialogElement | undefined = $state()
</script>

<button onclick={() => dialog_element?.showModal()}>Open</button>

<Dialog.Root bind:element={dialog_element}>
  {#snippet children({ close })}
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Title</Dialog.Title>
        <Dialog.Close onclick={close} />
      </Dialog.Header>
      <!-- content here -->
      <Dialog.Actions>
        <Button variant="secondary" type="button" onclick={close}>Cancelar</Button>
        <Button variant="primary" type="button">Confirmar</Button>
      </Dialog.Actions>
    </Dialog.Content>
  {/snippet}
</Dialog.Root>
```

## Table

Use `$lib/components/Table` for all data tables. `Table.Cell` requires children — never pass an empty cell, use `&nbsp;` for blank headers.

```svelte
<Table.Root>
  <Table.Header>
    <Table.Cell header>Column</Table.Cell>
    <Table.Cell header>&nbsp;</Table.Cell>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell>Value</Table.Cell>
      <Table.Cell>Value</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table.Root>
```

## Links (global style)

Text-only links are globally styled via `link.css` — blue-500 color, bottom border, blue-100 hover background. Do NOT add custom link styles for plain text links. The global selector `a:not(:has(*)):not(.button)` handles them automatically. Only add link styles for links that wrap other elements (icons, cards, etc.)

## Formulary

Use `$lib/components/Formulary` for standard forms. Drop down to raw `<form use:enhance>` only when you need custom enhance behavior (e.g. closing a dialog on success).
