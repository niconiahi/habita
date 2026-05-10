<script lang="ts">
  import Building from "./components/building.svelte"
  import Destinies from "./components/destinies.svelte"
  import Location from "./components/location.svelte"
  import Services from "./components/services.svelte"
  import Tags from "./components/tags.svelte"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<h2 class="heading-sm tab-title">Características</h2>
<Location {data} />
<Destinies {data} />
<Tags {data} />
<Building {data} />
<Services {data} />

<style>
  .tab-title {
    color: var(--color-text-heading);
  }
</style>
