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
  import { has_action_error } from "$lib/has_action_error"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { PageData, ActionData } from "./$types"
  let { data, form }: { data: PageData; form: ActionData } =
    $props()
  let input_errors = $derived(
    has_action_error(form, "update_user")
      ? (form.errors.update_user.input?.nested ?? {})
      : {},
  )
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
      <Section.Actions>
        <a
          class="learn-link"
          href="/learn/profile-information">Saber mas</a
        >
      </Section.Actions>
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
            {#each input_errors.name ?? [] as error}
              <Formulary.Error>{error}</Formulary.Error>
            {/each}
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
            {#each input_errors.surname ?? [] as error}
              <Formulary.Error>{error}</Formulary.Error>
            {/each}
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
            {#each input_errors.phone_number ?? [] as error}
              <div class="error-with-link">
                <Formulary.Error>{error}</Formulary.Error>
                <a class="button" href="/learn/phone-number"
                  >Mirar documentacion</a
                >
              </div>
            {/each}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="document_number"
              >numero de documento</Formulary.Label
            >
            <input
              id="document_number"
              name="document_number"
              type="number"
              value={data.user_profile.document_number ??
                ""}
            />
            {#each input_errors.document_number ?? [] as error}
              <Formulary.Error>{error}</Formulary.Error>
            {/each}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="cuil"
              >cuil</Formulary.Label
            >
            <input
              id="cuil"
              name="cuil"
              type="number"
              value={data.user_profile.cuil ?? ""}
            />
            {#each input_errors.cuil ?? [] as error}
              <Formulary.Error>{error}</Formulary.Error>
            {/each}
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
    <table class="documents-table">
      <thead>
        <tr>
          <th>Documento</th>
          <th>Tipo</th>
          <th>Acciones</th>
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

<style>
  .learn-link {
    color: var(--accent);
    text-decoration: underline;
  }

  .error-with-link {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .documents-table {
    width: 100%;
    margin-top: 1rem;
  }
  .documents-table th {
    text-align: left;
  }
</style>
