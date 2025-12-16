<script lang="ts">
  import * as Content from "$lib/components/Content";
  import { display_location } from "$lib/display_location";
  import { display_name } from "$lib/display_name";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<Content.Root>
  <Content.Title>Candidatos</Content.Title>
  <Content.Section>
    <p class="text-gray-600">
      {display_location(data.property.location)}
    </p>
    {#if data.candidates.length === 0}
      <p>No hay candidatos para revisar.</p>
    {:else}
      <div class="space-y-4">
        {#each data.candidates as candidate (candidate.id)}
          <div class="border rounded-lg p-4 space-y-2">
            <div class="space-y-1">
              <h2 class="text-lg font-semibold">
                {display_name(candidate)}
              </h2>
              <p class="text-sm text-gray-600">
                {candidate.email}
              </p>
              {#if candidate.phone_number}
                <p class="text-sm text-gray-600">
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
