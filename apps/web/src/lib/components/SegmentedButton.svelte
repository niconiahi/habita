<script lang="ts">
  interface Item {
    label: string
    value: string
  }

  interface Props {
    items: Item[]
    selected: string
    onchange: (value: string) => void
  }

  let { items, selected, onchange }: Props = $props()
</script>

<div class="container">
  {#each items as item (item.value)}
    <button
      class="body-md-bold segment"
      class:active={selected === item.value}
      type="button"
      onclick={() => onchange(item.value)}
    >
      {item.label}
    </button>
  {/each}
</div>

<style>
  .container {
    display: flex;
    align-items: center;
    width: fit-content;
    align-self: center;
    padding: var(--dimension-spacing-2) var(--dimension-spacing-3);
    background-color: var(--segment-button-bg);
    border-radius: 14px;
  }

  .segment {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--dimension-spacing-2);
    height: var(--dimension-spacing-10);
    padding: var(--dimension-spacing-2) 14px;
    border-radius: var(--dimension-radius-lg);
    border: none;
    background-color: transparent;
    color: var(--button-tertiary-fg-default);
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .segment.active {
    background-color: var(--button-primary-bg-default);
    color: var(--button-primary-fg-default);
    cursor: default;
  }
</style>
