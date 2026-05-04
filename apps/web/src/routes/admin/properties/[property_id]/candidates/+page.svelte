<script lang="ts">
  import * as Breadcrumb from "$lib/components/Breadcrumb"
  import * as Content from "$lib/components/Content"
  import { display_location } from "$lib/display_location"
  import { display_name } from "$lib/display_name"
  import type { PageData } from "./$types"
  let { data }: { data: PageData } = $props()
</script>

<Content.Root>
  <Breadcrumb.Root>
    <Breadcrumb.Link href="/admin/properties"
      >Propiedades</Breadcrumb.Link
    >
    <Breadcrumb.Link
      href="/admin/properties/{data.property.id}/edit/characteristics"
    >
      {data.property.location.road}
      {data.property.location.house_number}
    </Breadcrumb.Link>
    <Breadcrumb.Current>Candidatos</Breadcrumb.Current>
  </Breadcrumb.Root>
  <Content.Title>Candidatos</Content.Title>
  <Content.Section>
    {#if data.candidates.length === 0}
      <p>No hay candidatos para revisar.</p>
    {:else}
      <div class="candidate-list">
        {#each data.candidates as candidate (candidate.id)}
          <div class="candidate-card">
            <div class="candidate-info">
              <h2 class="candidate-name">
                {display_name(candidate)}
              </h2>
              <p class="candidate-detail">
                {candidate.email}
              </p>
              {#if candidate.phone_number}
                <p class="candidate-detail">
                  {candidate.phone_number}
                </p>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </Content.Section>
</Content.Root>

<style>
  .candidate-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .candidate-card {
    border: 1px solid;
    border-radius: 0.5rem;
    padding: 1rem;
  }
  .candidate-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .candidate-name {
    font-size: 1.125rem;
    line-height: 1.75rem;
    font-weight: 600;
  }
  .candidate-detail {
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: rgb(75 85 99);
  }
</style>
