<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import Button from "$lib/components/Button.svelte"
  import {
    SIGNATURE_STATUS,
    get_signature_status_label,
  } from "$lib/signature_status"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "../actions/action"
  import type { PageData, ActionData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } =
    $props()

  let cert_result = $derived(form as any)

  let has_contract_pdf = $derived(
    data.contract.files.some((f) => f.type === 0),
  )
  let has_signed_pdf = $derived(
    data.contract.files.some((f) => f.type === 2),
  )
  let both_signed = $derived(
    data.signature?.landlord_status ===
      SIGNATURE_STATUS.SIGNED &&
      data.signature?.tenant_status ===
        SIGNATURE_STATUS.SIGNED,
  )
</script>

<Content.Section>
  <Section.Header>
    <Section.Title>acciones</Section.Title>
    <Section.Actions>
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
        <Button variant="primary" type="submit">Generar contrato</Button>
      </form>
    </Section.Actions>
  </Section.Header>
</Content.Section>

{#if has_contract_pdf}
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
            <Button variant="primary" type="submit">Iniciar onboarding</Button>
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
            <Button variant="primary" type="submit">Iniciar onboarding</Button>
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
              <Button variant="primary" type="submit">Enviar a firmar</Button>
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
            <Button variant="primary" type="submit">Iniciar onboarding</Button>
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
            <Button variant="primary" type="submit">Iniciar onboarding</Button>
          </form>
        </div>
      </div>
    {/if}
  </Content.Section>
{/if}

<style>
  .error {
    color: rgb(239 68 68);
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
