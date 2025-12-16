<script lang="ts">
  import * as Content from "$lib/components/Content";
  import * as Formulary from "$lib/components/Formulary";
  import Button from "$lib/components/Button.svelte";
  import { display_location } from "$lib/display_location";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const has_available_properties = $derived(
    data.available_properties.length > 0
  );
</script>

{#if !has_available_properties}
  <p>No hay propiedades disponibles para crear un contrato.</p>
{:else}
  <Content.Root>
    <Content.Title>Creación de contrato</Content.Title>
    <Content.Section>
      <Formulary.Root method="POST">
        <Formulary.Fields>
          <Formulary.Field>
            <Formulary.Label for="property_id">Propiedad</Formulary.Label>
            <Formulary.Select id="property_id" name="property_id" required>
              <option value="">Selecciona una propiedad</option>
              {#each data.available_properties as property (property.id)}
                <option value={property.id}>
                  {display_location(property.location)}
                  {property.unit ? ` - ${property.unit}` : ""}
                </option>
              {/each}
            </Formulary.Select>
          </Formulary.Field>
        </Formulary.Fields>
        <Formulary.Actions>
          <Button type="submit">Continuar</Button>
        </Formulary.Actions>
      </Formulary.Root>
    </Content.Section>
  </Content.Root>
{/if}
