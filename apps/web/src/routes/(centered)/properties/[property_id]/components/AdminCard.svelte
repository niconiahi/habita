<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import { display_name } from "$lib/display_name"

  interface Props {
    manager: {
      name: string
      surname: string
      image: string | null
    }
    property_id: number
  }

  let { manager, property_id }: Props = $props()
</script>

<div class="card">
  <h3 class="heading-sm title">Administrador</h3>
  <div class="profile">
    <img
      class="avatar"
      src={manager.image}
      alt={display_name(manager)}
    />
    <span class="body-md-medium name">
      {display_name(manager)}
    </span>
  </div>
  <a href={`/properties/${property_id}/book`}>
    <Button variant="secondary">Agendar visita</Button>
  </a>
</div>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-3);
    padding: var(--dimension-spacing-4);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-xl);
  }

  .title {
    color: var(--color-text-heading);
  }

  .profile {
    display: flex;
    align-items: center;
    gap: var(--dimension-spacing-2);
  }

  .avatar {
    width: var(--avatar-size-lg);
    height: var(--avatar-size-lg);
    border-radius: var(--dimension-radius-full);
    object-fit: cover;
  }

  .name {
    color: var(--color-text-body);
  }

  a {
    display: contents;
  }

  a :global(button) {
    width: 100%;
  }
</style>
