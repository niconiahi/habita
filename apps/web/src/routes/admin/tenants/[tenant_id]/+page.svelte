<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import { display_name } from "$lib/display_name"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<Content.Root>
  <Content.Title>{display_name(data.tenant)}</Content.Title>
  <Content.Section>
    <Section.Header>
      <Section.Title>Información de contacto</Section.Title>
    </Section.Header>
    <div class="space-y-2">
      <div class="space-y-1">
        <p class="text-sm text-gray-500">Nombre</p>
        <p>{display_name(data.tenant)}</p>
      </div>
      <div class="space-y-1">
        <p class="text-sm text-gray-500">Email</p>
        <p>{data.tenant.email}</p>
      </div>
    </div>
  </Content.Section>
</Content.Root>
