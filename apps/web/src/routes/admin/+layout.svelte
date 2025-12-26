<script lang="ts">
  import * as Dashboard from "$lib/components/Dashboard"
  import type { Snippet } from "svelte"

  let { children }: { children: Snippet } = $props()
</script>

<div class="navigation">
  <Dashboard.Root label="Admin navigation">
    <Dashboard.Section>
      <Dashboard.Link href="/admin/properties"
        >Propiedades</Dashboard.Link
      >
      <Dashboard.Link href="/admin/tenants"
        >Inquilinos</Dashboard.Link
      >
      <Dashboard.Link href="/admin/candidates"
        >Candidatos</Dashboard.Link
      >
      <Dashboard.Link href="/admin/contracts?state=0"
        >Contratos</Dashboard.Link
      >
    </Dashboard.Section>
  </Dashboard.Root>
  {@render children()}
</div>

<style>
  .navigation {
    display: flex;
  }
</style>
