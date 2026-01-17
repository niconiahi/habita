<script lang="ts">
  import type { Snippet } from "svelte"
  import type { HTMLSelectAttributes } from "svelte/elements"

  type Props = HTMLSelectAttributes & {
    children: Snippet
    value?: string | number
  }

  let { children, value = $bindable<string | number>(""), ...rest }: Props = $props()
</script>

<select bind:value {...rest}>
  {@render children()}
</select>

<style>
  select {
    color: var(--gray-100);
  }
  select::placeholder {
    color: var(--gray-100);
  }
</style>
