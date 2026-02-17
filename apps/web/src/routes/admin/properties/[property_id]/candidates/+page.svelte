<script lang="ts">
  import * as Content from "$lib/components/Content"
  import { display_location } from "$lib/display_location"
  import { display_name } from "$lib/display_name"
  import type { PageData } from "./$types"
  let { data }: { data: PageData } = $props()
</script>

<Content.Root>
  <Content.Title>Candidatos</Content.Title>
  <Content.Section>
    <p class="subtitle">
      {display_location(data.property.location)}
    </p>
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
  .subtitle {
    color: rgb(75 85 99);
  }
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
