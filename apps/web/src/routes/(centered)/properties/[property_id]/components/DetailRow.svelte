<script lang="ts">
  interface Props {
    label: string
    items: string[]
  }

  let { label, items }: Props = $props()
</script>

{#if items.length > 0}
  <div class="row">
    <span class="body-md-bold label">{label}</span>
    <div class="badges">
      {#each items as item}
        <span class="body-sm-medium badge">{item}</span>
      {/each}
    </div>
  </div>
{/if}

<style>
  .row {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
  }

  .label {
    color: var(--color-text-heading);
  }

  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dimension-spacing-2);
  }

  .badge {
    padding: var(--dimension-spacing-1)
      var(--dimension-spacing-3);
    background-color: var(--badge-bg);
    color: var(--badge-fg);
    border-radius: var(--dimension-radius-full);
  }
</style>
