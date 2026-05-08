<script lang="ts">
  import { enhance } from "$app/forms"
  import * as v from "valibot"
  import * as Content from "$lib/components/Content"
  import * as Dialog from "$lib/components/Dialog"
  import * as Formulary from "$lib/components/Formulary"
  import * as Section from "$lib/components/Section"
  import Button from "$lib/components/Button.svelte"
  import { compose_action } from "$lib/compose_action"
  import { CONTRACT_FILE_TYPE } from "$lib/contract_file_type"
  import {
    ContractFileTypeSchema,
    get_contract_file_type_label,
  } from "$lib/contract_file_type"
  import {
    SIGNATURE_STATUS,
    get_signature_status_label,
  } from "$lib/signature_status"
  import { ACTION } from "../actions/action"
  import type { PageData, ActionData } from "./$types"

  let activation_dialog_element:
    | HTMLDialogElement
    | undefined = $state()

  let { data, form }: { data: PageData; form: ActionData } =
    $props()

  let create_pdf_errors = $derived(
    (form?.errors as any)?.create_pdf ?? {},
  )
  let cert_result = $derived(form as any)

  let has_contract_pdf = $derived(
    data.contract.files.some(
      (f) => f.type === CONTRACT_FILE_TYPE.CONTRACT,
    ),
  )
  let has_signed_pdf = $derived(
    data.contract.files.some(
      (f) => f.type === CONTRACT_FILE_TYPE.SIGNED,
    ),
  )
  let both_signed = $derived(
    data.signature?.landlord_status ===
      SIGNATURE_STATUS.SIGNED &&
      data.signature?.tenant_status ===
        SIGNATURE_STATUS.SIGNED,
  )

  let download_url = $derived(
    `/admin/properties/${data.property.id}/contracts/${data.contract.id}/download`,
  )
</script>

{#snippet ContractActions()}
  <Content.Section>
    <Section.Header>
      <Section.Title>contrato</Section.Title>
      <Section.Actions>
        {#if !data.is_read_only}
          <form
            method="POST"
            action={compose_action(ACTION.CREATE_PDF)}
            use:enhance
          >
            <input
              type="hidden"
              value={data.contract.id}
              name="id"
            />
            <Button variant="primary" type="submit">
              {has_contract_pdf
                ? "Regenerar contrato"
                : "Generar contrato"}
            </Button>
          </form>
        {/if}
        {#if has_contract_pdf}
          <a
            href={download_url}
            class="button body-md-bold secondary"
            >Descargar contrato</a
          >
        {/if}
        {#if !data.is_read_only && has_contract_pdf}
          <Button
            variant="primary"
            type="button"
            onclick={() =>
              activation_dialog_element?.showModal()}
            >Activar contrato</Button
          >
        {/if}
      </Section.Actions>
    </Section.Header>
    {#if !has_contract_pdf}
      <p class="body-sm">Aún no hay contrato generado</p>
    {/if}
    {#if create_pdf_errors.property_road || create_pdf_errors.property_house_number || create_pdf_errors.property_state || create_pdf_errors.property_unit}
      <div class="error-block">
        <p class="error-block-title">Errores de propiedad:</p>
        {#if create_pdf_errors.property_road}
          <span class="error block"
            >{create_pdf_errors.property_road}</span
          >
        {/if}
        {#if create_pdf_errors.property_house_number}
          <span class="error block"
            >{create_pdf_errors.property_house_number}</span
          >
        {/if}
        {#if create_pdf_errors.property_state}
          <span class="error block"
            >{create_pdf_errors.property_state}</span
          >
        {/if}
        {#if create_pdf_errors.property_unit}
          <span class="error block"
            >{create_pdf_errors.property_unit}</span
          >
        {/if}
      </div>
    {/if}
    {#if form?.message}
      <p class="error">{form.message}</p>
    {/if}
  </Content.Section>
{/snippet}

{#snippet FileList()}
  <Content.Section>
    <Section.Header>
      <Section.Title>archivos</Section.Title>
    </Section.Header>
    <ul class="file-list">
      {#each data.contract.files as file (file.id)}
        {@const contract_type = v.parse(
          ContractFileTypeSchema,
          file.type,
        )}
        <li class="file-item">
          <span class="file-type body-sm-bold"
            >{get_contract_file_type_label(
              contract_type,
            )}</span
          >
          <a
            target="_blank"
            href="/files/{file.id}"
            class="file-link">{file.basename}</a
          >
        </li>
      {/each}
      {#each data.tenant_insurance_files as file (file.id)}
        <li class="file-item">
          <span class="file-type body-sm-bold">Seguro</span>
          <a
            target="_blank"
            href="/files/{file.id}"
            class="file-link">{file.basename}</a
          >
        </li>
      {/each}
    </ul>
  </Content.Section>
{/snippet}

{#snippet DigitalSignature()}
  <Content.Section>
    <Section.Header>
      <Section.Title>firma digital</Section.Title>
    </Section.Header>
    {#if has_signed_pdf && both_signed}
      <div class="signing-success">
        <p class="signing-success-text">Contrato firmado</p>
      </div>
    {:else if data.signature}
      <div class="signing-status">
        <div class="signing-party">
          <p class="info-block-label">Locador</p>
          <p>
            {get_signature_status_label(
              data.signature.landlord_status,
            )}
          </p>
          {#if data.signature.landlord_url && data.signature.landlord_status === SIGNATURE_STATUS.PENDING}
            <a
              href={data.signature.landlord_url}
              target="_blank"
              class="file-link">Enlace de firma</a
            >
          {/if}
          <form
            method="POST"
            action={compose_action(ACTION.START_ONBOARDING)}
            use:enhance
          >
            <input
              type="hidden"
              name="party"
              value="landlord"
            />
            <Button variant="primary" type="submit"
              >Iniciar onboarding</Button
            >
          </form>
        </div>
        <div class="signing-party">
          <p class="info-block-label">Locatario</p>
          <p>
            {get_signature_status_label(
              data.signature.tenant_status,
            )}
          </p>
          {#if data.signature.tenant_url && data.signature.tenant_status === SIGNATURE_STATUS.PENDING}
            <a
              href={data.signature.tenant_url}
              target="_blank"
              class="file-link">Enlace de firma</a
            >
          {/if}
          <form
            method="POST"
            action={compose_action(ACTION.START_ONBOARDING)}
            use:enhance
          >
            <input
              type="hidden"
              name="party"
              value="tenant"
            />
            <Button variant="primary" type="submit"
              >Iniciar onboarding</Button
            >
          </form>
        </div>
      </div>
    {:else}
      {#if cert_result?.errors?.check_certificates}
        <span class="error"
          >{cert_result.errors.check_certificates}</span
        >
      {/if}
      {#if cert_result?.errors?.send_for_signing}
        <span class="error"
          >{cert_result.errors.send_for_signing}</span
        >
      {/if}
      {#if cert_result?.landlord_has_cert !== undefined}
        <div class="signing-status">
          <div class="signing-party">
            <p class="info-block-label">Locador</p>
            <p>
              {cert_result.landlord_has_cert
                ? "Tiene certificado"
                : "Sin certificado"}
            </p>
          </div>
          <div class="signing-party">
            <p class="info-block-label">Locatario</p>
            <p>
              {cert_result.tenant_has_cert
                ? "Tiene certificado"
                : "Sin certificado"}
            </p>
          </div>
          {#if cert_result.landlord_has_cert && cert_result.tenant_has_cert}
            <form
              method="POST"
              action={compose_action(
                ACTION.SEND_FOR_SIGNING,
              )}
              use:enhance
            >
              <input
                type="hidden"
                name="contract_id"
                value={data.contract.id}
              />
              <Button variant="primary" type="submit"
                >Enviar a firmar</Button
              >
            </form>
          {/if}
        </div>
      {/if}
      <div class="signing-status">
        <form
          method="POST"
          action={compose_action(ACTION.CHECK_CERTIFICATES)}
          use:enhance
        >
          <Button variant="primary" type="submit"
            >Verificar certificados</Button
          >
        </form>
        <div class="signing-party">
          <p class="info-block-label">Locador</p>
          <form
            method="POST"
            action={compose_action(ACTION.START_ONBOARDING)}
            use:enhance
          >
            <input
              type="hidden"
              name="party"
              value="landlord"
            />
            <Button variant="primary" type="submit"
              >Iniciar onboarding</Button
            >
          </form>
        </div>
        <div class="signing-party">
          <p class="info-block-label">Locatario</p>
          <form
            method="POST"
            action={compose_action(ACTION.START_ONBOARDING)}
            use:enhance
          >
            <input
              type="hidden"
              name="party"
              value="tenant"
            />
            <Button variant="primary" type="submit"
              >Iniciar onboarding</Button
            >
          </form>
        </div>
      </div>
    {/if}
  </Content.Section>
{/snippet}

{@render ContractActions()}
{@render FileList()}
{#if data.is_webmaster && has_contract_pdf && !data.is_read_only}
  {@render DigitalSignature()}
{/if}

<Dialog.Root bind:element={activation_dialog_element}>
  {#snippet children({ close })}
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>¿Activar contrato?</Dialog.Title>
        <Dialog.Close onclick={close} />
      </Dialog.Header>
      <p class="body-md">
        Una vez activado, el contrato no podrá editarse y
        comenzarán a correr los pagos. Esta acción no puede
        deshacerse.
      </p>
      {#if form?.message}
        <Formulary.Error>{form.message}</Formulary.Error>
      {/if}
      <Dialog.Actions>
        <Button
          variant="secondary"
          type="button"
          onclick={close}>Cancelar</Button
        >
        <Formulary.Root
          method="POST"
          action={compose_action(ACTION.ACTIVATE_CONTRACT)}
        >
          <Button variant="primary" type="submit"
            >Activar contrato</Button
          >
        </Formulary.Root>
      </Dialog.Actions>
    </Dialog.Content>
  {/snippet}
</Dialog.Root>

<style>
  .error {
    color: rgb(239 68 68);
  }

  .block {
    display: block;
  }

  .error-block {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .error-block-title {
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    color: rgb(239 68 68);
  }

  .file-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .file-type {
    font-weight: 700;
  }

  .file-link {
    color: rgb(59 130 246);
    text-decoration: underline;
  }

  .info-block-label {
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: rgb(107 114 128);
  }

  .signing-status {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .signing-party {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .signing-success {
    padding: 0.75rem;
    border-radius: 0.25rem;
    background-color: rgb(34 197 94 / 0.1);
    border: 1px solid rgb(34 197 94);
  }

  .signing-success-text {
    color: rgb(34 197 94);
    font-weight: 500;
  }
</style>
