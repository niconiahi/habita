<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import { display_name } from "$lib/display_name"
  import type { PageData } from "./$types"
  let { data }: { data: PageData } = $props()
</script>

<Content.Root>
  <Content.Title
    >{display_name(data.candidate)}</Content.Title
  >
  <Content.Section>
    <Section.Header>
      <Section.Title>Información de contacto</Section.Title>
    </Section.Header>
    <div class="info-group">
      <div class="info-block">
        <p class="info-label">Nombre</p>
        <p>{display_name(data.candidate)}</p>
      </div>
      <div class="info-block">
        <p class="info-label">Email</p>
        <p>{data.candidate.email}</p>
      </div>
      {#if data.candidate.phone_number}
        <div class="info-block">
          <p class="info-label">Teléfono</p>
          <p>{data.candidate.phone_number}</p>
        </div>
      {/if}
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
