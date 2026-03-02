<script lang="ts">
  interface Props {
    label: string
    active: boolean
  }
  let { label, active }: Props = $props()
</script>

<button class="tag-chip" class:active type="submit">
  {label}
</button>

<style>
  .tag-chip {
    display: inline-flex;
    align-items: center;
    padding: var(--spacing-1) var(--spacing-3);
    border-radius: 9999px;
    font-size: 0.875rem;
    border: 1px solid var(--gray-400);
    background-color: transparent;
    color: var(--gray-100);
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .tag-chip:hover {
    background-color: var(--gray-600);
  }
  .tag-chip.active {
    background-color: var(--gray-100);
    color: var(--gray-900);
    border-color: var(--gray-100);
  }
  .tag-chip.active:hover {
    background-color: var(--gray-300);
  }
</style>
