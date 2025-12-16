<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLSelectAttributes } from "svelte/elements";

  interface Props extends HTMLSelectAttributes {
    children: Snippet;
  }

  let { children, ...rest }: Props = $props();
</script>

<select {...rest}>
  {@render children()}
</select>
