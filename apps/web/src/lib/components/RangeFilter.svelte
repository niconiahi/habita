<script lang="ts">
  interface Props {
    label: string
    name: string
    min: number
    max: number
    value_min?: number
    value_max?: number
  }
  let {
    label,
    name,
    min,
    max,
    value_min = $bindable(),
    value_max = $bindable(),
  }: Props = $props()
</script>

<fieldset class="range-filter">
  <legend class="range-label body-sm-medium">{label}</legend>
  <div class="range-inputs">
    <label class="range-field">
      <span class="range-field-label">Min</span>
      <input
        type="number"
        name="{name}_min"
        {min}
        {max}
        bind:value={value_min}
        placeholder={String(min)}
      />
    </label>
    <label class="range-field">
      <span class="range-field-label">Max</span>
      <input
        type="number"
        name="{name}_max"
        {min}
        {max}
        bind:value={value_max}
        placeholder={String(max)}
      />
    </label>
  </div>
</fieldset>

<style>
  .range-filter {
    border: none;
    padding: 0;
    margin: 0;
  }
  .range-label {
    color: var(--color-text-heading);
    margin-bottom: var(--dimension-spacing-2);
  }
  .range-label::first-letter {
    text-transform: uppercase;
  }
  .range-inputs {
    display: flex;
    flex-direction: row;
    gap: var(--dimension-spacing-3);
  }
  .range-field {
    display: flex;
    align-items: center;
    gap: var(--dimension-spacing-3);
  }
  .range-field-label {
    color: var(--color-text-body);
    font-size: var(--font-size-body-sm);
    flex-shrink: 0;
  }
</style>
