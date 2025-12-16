<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLParagraphElement> {
    children: Snippet;
  }

  let { children, class: className, ...rest }: Props = $props();
</script>

<p class="content" {...rest}>
  {@render children()}
</p>

<style>
  .content {
    grid-column: 1;
    grid-row: 2;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--gray-100);
    line-height: 1.2;
  }
</style>
