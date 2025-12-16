<script lang="ts">
  import * as Content from "$lib/components/Content";
  import * as Section from "$lib/components/Section";
  import Button from "$lib/components/Button.svelte";
  import RoomMap from "$lib/components/RoomMap.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<Content.Root>
  <Content.Title>Propiedad</Content.Title>
  <Content.Section>
    <p>
      La propiedad ubicada en {data.property.location.road}
      {data.property.location.house_number}
    </p>
    <a
      href={data.has_credit_report
        ? `/properties/${data.property.id}/book`
        : "/learn/booking"}
    >
      <Button>Reservar</Button>
    </a>
  </Content.Section>
  <Content.Section>
    <Section.Header>
      <Section.Title>Mapa de ambientes</Section.Title>
    </Section.Header>
    <RoomMap rooms={data.property.rooms} is_readonly={true} />
  </Content.Section>
</Content.Root>
