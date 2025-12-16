<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
    label?: string;
  }

  let { children, label }: Props = $props();
</script>

<section aria-labelledby={label ? "section-label" : undefined}>
  {#if label}
    <h2 id="section-label">{label}</h2>
  {/if}
  <ul>
    {@render children()}
  </ul>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  h2 {
    padding: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #737373;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }
</style>
