<script lang="ts">
  import * as Breadcrumb from "$lib/components/Breadcrumb"
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import { display_name } from "$lib/display_name"
  import type { PageData } from "./$types"
  let { data }: { data: PageData } = $props()
</script>

<Content.Root>
  <Breadcrumb.Root>
    <Breadcrumb.Link href="/admin/tenants"
      >Inquilinos</Breadcrumb.Link
    >
    <Breadcrumb.Current>
      {display_name(data.tenant)}
    </Breadcrumb.Current>
  </Breadcrumb.Root>
  <Content.Title>{display_name(data.tenant)}</Content.Title>
  <Content.Section>
    <Section.Header>
      <Section.Title>Información de contacto</Section.Title>
    </Section.Header>
    <div class="info-group">
      <div class="info-block">
        <p class="info-label">Nombre</p>
        <p>{display_name(data.tenant)}</p>
      </div>
      <div class="info-block">
        <p class="info-label">Email</p>
        <p>{data.tenant.email}</p>
      </div>
    </div>
  </Content.Section>
</Content.Root>

<style>
  .info-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .info-block {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .info-label {
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: rgb(107 114 128);
  }
</style>
