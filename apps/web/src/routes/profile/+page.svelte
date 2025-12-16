<script lang="ts">
  import * as Content from "$lib/components/Content";
  import * as Section from "$lib/components/Section";
  import * as Formulary from "$lib/components/Formulary";
  import Button from "$lib/components/Button.svelte";
  import { get_access_type_label } from "$lib/access_type";
  import {
    get_user_file_type_label,
    USER_FILE_TYPE
  } from "$lib/user_file_type";
  import { compose_action } from "$lib/compose_action";
  import { ACTION } from "./actions/action";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let file_input: HTMLInputElement | undefined = $state();
  let form_el: HTMLFormElement | undefined = $state();

  function handle_add_click() {
    file_input?.click();
  }

  function handle_file_change() {
    form_el?.requestSubmit();
  }

  function get_property(id: number) {
    const property = data.properties.find((p) => p.id === id);
    if (!property) throw new Error("property should exist");
    return property;
  }
</script>

<Content.Root>
  <Content.Title>Perfil</Content.Title>

  <Content.Section>
    <Section.Header>
      <Section.Title>accesos</Section.Title>
    </Section.Header>
    <table class="w-full">
      <thead>
        <tr>
          <th class="text-left">Rol</th>
          <th class="text-left">Propiedad</th>
        </tr>
      </thead>
      <tbody>
        {#each data.user.accesses as access}
          {@const property = get_property(access.property_id)}
          <tr>
            <td>{get_access_type_label(access.type)}</td>
            <td>
              <a href={`/properties/${property.id}`}>
                {property.location.road}
                {property.location.house_number}
              </a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </Content.Section>

  <Content.Section>
    <Section.Header>
      <Section.Title>documentos</Section.Title>
      <Section.Actions>
        <Button type="button" onclick={handle_add_click}
          >Agregar documento</Button
        >
      </Section.Actions>
    </Section.Header>

    <form
      bind:this={form_el}
      method="POST"
      action={compose_action(ACTION.CREATE_FILE)}
      enctype="multipart/form-data"
      class="flex gap-4 items-end"
    >
      <input
        bind:this={file_input}
        type="file"
        name="file"
        class="sr-only"
        onchange={handle_file_change}
      />
      <Formulary.Field>
        <Formulary.Label for="type">tipo</Formulary.Label>
        <Formulary.Select name="type" id="type">
          {#each Object.values(USER_FILE_TYPE) as type}
            <option value={type}>{get_user_file_type_label(type)}</option>
          {/each}
        </Formulary.Select>
      </Formulary.Field>
    </form>

    <table class="w-full mt-4">
      <thead>
        <tr>
          <th class="text-left">Documento</th>
          <th class="text-left">Tipo</th>
          <th class="text-left">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {#each data.user_files as file}
          <tr>
            <td>{file.basename}</td>
            <td>{get_user_file_type_label(file.type)}</td>
            <td>
              <a
                href={`/files/${file.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Descargar
              </a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </Content.Section>
</Content.Root>
