<script lang="ts">
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<article class="markdown">
  {@html data.article.content}
</article>
