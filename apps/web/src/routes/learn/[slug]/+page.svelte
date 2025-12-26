<script lang="ts">
  import * as Content from "$lib/components/Content"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<Content.Root>
  <Content.Section>
    <article class="prose">
      {@html data.article.content}
    </article>
  </Content.Section>
</Content.Root>
