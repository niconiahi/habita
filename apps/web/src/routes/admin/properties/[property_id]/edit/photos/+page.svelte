<script lang="ts">
  import { enhance } from "$app/forms"
  import Button from "$lib/components/Button.svelte"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "../actions/action"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  let file_input: HTMLInputElement | undefined = $state()
  let photo_form: HTMLFormElement | undefined = $state()

  function handle_add_photo_click() {
    file_input?.click()
  }

  function handle_photo_change() {
    photo_form?.requestSubmit()
  }
</script>

<section>
  <div class="tab-header">
    <h2 class="heading-sm tab-title">Fotos</h2>
    <Button
      variant="secondary"
      type="button"
      onclick={handle_add_photo_click}>Agregar foto</Button
    >
  </div>
  <ul class="photo-grid">
    {#each data.property.images as image (`image_${image.id}`)}
      <li>
        <img
          class="photo"
          alt="Foto de la propiedad"
          src={`/files/${image.id}`}
        />
      </li>
    {/each}
  </ul>
  <form
    bind:this={photo_form}
    method="POST"
    action={compose_action(ACTION.CREATE_PROPERTY_FILE)}
    enctype="multipart/form-data"
    class="hidden-form"
    onchange={handle_photo_change}
    use:enhance
  >
    <input
      bind:this={file_input}
      type="file"
      name="file"
      class="sr-only"
    />
  </form>
</section>

<style>
  .tab-title {
    color: var(--color-text-heading);
  }

  .tab-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .photo-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 1rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  @media (min-width: 800px) {
    .photo-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (min-width: 1200px) {
    .photo-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .photo {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
  }

  .hidden-form {
    display: contents;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
