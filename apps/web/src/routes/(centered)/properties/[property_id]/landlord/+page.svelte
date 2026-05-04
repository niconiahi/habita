<script lang="ts">
  import * as Breadcrumb from "$lib/components/Breadcrumb"
  import * as Content from "$lib/components/Content"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<Content.Root>
  {#if data.property_location}
    <Breadcrumb.Root>
      <Breadcrumb.Link
        href="/properties/{data.property_id}"
      >
        {data.property_location.road}
        {data.property_location.house_number}
      </Breadcrumb.Link>
      <Breadcrumb.Current>Propietario</Breadcrumb.Current>
    </Breadcrumb.Root>
  {/if}
  <Content.Title>Panel de propietario</Content.Title>
  <p class="body-md-medium placeholder">Próximamente</p>
</Content.Root>

<style>
  .placeholder {
    color: var(--color-text-body);
    padding-top: var(--dimension-spacing-4);
  }
</style>
