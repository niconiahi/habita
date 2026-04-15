<script lang="ts">
  interface Props {
    organization: {
      name: string
      slug: string | null
      logo: string | null
    }
  }

  let { organization }: Props = $props()
</script>

<div class="card">
  <h3 class="heading-sm title">Inmobiliaria</h3>
  <div class="profile">
    {#if organization.logo}
      <img
        class="logo"
        src={organization.logo}
        alt={organization.name}
      />
    {/if}
    <span class="body-md-medium name">
      {organization.name}
    </span>
  </div>
  {#if organization.slug}
    <a class="body-md-medium link" href={`/organizations/${organization.slug}`}>
      Visitar perfil
    </a>
  {/if}
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

  .logo {
    width: var(--avatar-size-lg);
    height: var(--avatar-size-lg);
    border-radius: var(--dimension-radius-full);
    object-fit: cover;
  }

  .name {
    color: var(--color-text-body);
  }

  .link {
    color: var(--color-blue-500);
  }
</style>
