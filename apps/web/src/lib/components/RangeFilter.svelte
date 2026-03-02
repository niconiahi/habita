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
    value_min,
    value_max,
  }: Props = $props()
</script>

<fieldset class="range-filter">
  <legend class="range-label">{label}</legend>
  <div class="range-inputs">
    <label class="range-field">
      <span class="range-field-label">Min</span>
      <input
        type="number"
        name="{name}_min"
        {min}
        {max}
        value={value_min ?? ""}
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
        value={value_max ?? ""}
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
    color: var(--gray-100);
    font-size: 0.875rem;
    margin-bottom: var(--spacing-2);
  }
  .range-label::first-letter {
    text-transform: uppercase;
  }
  .range-inputs {
    display: flex;
    flex-direction: row;
    gap: var(--spacing-3);
  }
  .range-field {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
  }
  .range-field-label {
    color: var(--gray-300);
    font-size: 0.875rem;
    flex-shrink: 0;
  }
</style>
