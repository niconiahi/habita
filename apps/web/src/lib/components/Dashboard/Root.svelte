<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
    label: string
  }

  let { children, label }: Props = $props()
</script>

<nav class="dashboard" aria-label={label}>
  {@render children()}
</nav>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: 100%;
    background-color: transparent;
  }
</style>
