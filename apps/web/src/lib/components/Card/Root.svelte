<script lang="ts">
  import type { Snippet } from "svelte"
  import type { HTMLAttributes } from "svelte/elements"

  interface Props extends HTMLAttributes<HTMLElement> {
    children: Snippet
  }

  let { children, ...rest }: Props = $props()
</script>

<article {...rest}>
  {@render children()}
</article>

<style>
  article {
    display: grid;
    grid-template-columns: 200px 1fr;
    border: 2px solid var(--gray-400);
    border-radius: 0.5rem;
    background-color: var(--gray-700);
    overflow: hidden;
    padding: var(--spacing-2);
  }

  article:not(:has(> :global(img))):not(
      :has(> :global(section))
    ) {
    grid-template-columns: 1fr;
  }

  article > :global(img) {
    grid-column: 1;
    grid-row: 1 / -1;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border: 2px solid var(--gray-400);
    border-radius: 0.5rem;
  }

  article > :global(section) {
    grid-column: 1;
    grid-row: 1 / -1;
    border: 2px solid var(--gray-400);
    border-radius: 0.5rem;
    overflow: hidden;
  }

  article:has(> :global(img)) > :global(.body),
  article:has(> :global(section)) > :global(.body) {
    grid-column: 2;
    grid-row: 1 / -1;
  }

  article:not(:has(> :global(img))):not(
      :has(> :global(section))
    )
    > :global(article-body) {
    grid-column: 1;
  }
</style>
