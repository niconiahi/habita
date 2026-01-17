<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import TypedFileUploadButton from "$lib/components/TypedFileUploadButton.svelte"
  import {
    get_user_file_type_label,
    USER_FILE_TYPE,
  } from "$lib/user_file_type"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { PageData, ActionData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } =
    $props()
  let errors = $derived(form?.errors?.update_user ?? {})

  const document_types = Object.values(USER_FILE_TYPE).map(
    (type) => ({
      value: type,
      label: get_user_file_type_label(type),
    }),
  )
</script>

{#snippet PersonalInfo()}
  <Content.Section>
    <Section.Header>
      <Section.Title>informacion personal</Section.Title>
    </Section.Header>
    {#key data.user_profile}
      <Formulary.Root
        method="POST"
        action={compose_action(ACTION.UPDATE_USER)}
      >
        <Formulary.Fields>
          <Formulary.Field>
            <Formulary.Label for="name"
              >nombre</Formulary.Label
            >
            <input
              id="name"
              name="name"
              type="text"
              value={data.user_profile.name}
              required
            />
            {#if errors.name}
              <Formulary.Error>{errors.name}</Formulary.Error>
            {/if}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="surname"
              >apellido</Formulary.Label
            >
            <input
              id="surname"
              name="surname"
              type="text"
              value={data.user_profile.surname}
              required
            />
            {#if errors.surname}
              <Formulary.Error
                >{errors.surname}</Formulary.Error
              >
            {/if}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="phone_number"
              >telefono</Formulary.Label
            >
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              value={data.user_profile.phone_number ?? ""}
              placeholder="+5491123456789"
            />
            {#if errors.phone_number}
              <div class="flex gap-2 items-center">
                <Formulary.Error
                  >{errors.phone_number}</Formulary.Error
                >
                <a class="button" href="/learn/phone-number"
                  >Mirar documentacion</a
                >
              </div>
            {/if}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="document_number"
              >numero de documento</Formulary.Label
            >
            <input
              id="document_number"
              name="document_number"
              type="number"
              value={data.user_profile.document_number ?? ""}
            />
            {#if errors.document_number}
              <Formulary.Error
                >{errors.document_number}</Formulary.Error
              >
            {/if}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="email"
              >email</Formulary.Label
            >
            <input
              id="email"
              name="email"
              type="email"
              value={data.user_profile.email}
              disabled
            />
          </Formulary.Field>
        </Formulary.Fields>
        <Formulary.Actions>
          <Button type="submit">Guardar informacion</Button>
        </Formulary.Actions>
      </Formulary.Root>
    {/key}
  </Content.Section>
{/snippet}

{#snippet Documents()}
  <Content.Section>
    <Section.Header>
      <Section.Title>documentos</Section.Title>
      <Section.Actions>
        <TypedFileUploadButton
          types={document_types}
          label="Agregar documento"
          action={compose_action(ACTION.CREATE_FILE)}
        />
      </Section.Actions>
    </Section.Header>
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
{/snippet}

<Content.Root>
  <Content.Title>Perfil</Content.Title>
  {@render PersonalInfo()}
  {@render Documents()}
</Content.Root>
