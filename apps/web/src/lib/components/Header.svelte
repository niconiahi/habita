<script lang="ts">
  import Button from "$lib/components/Button.svelte"

  interface Props {
    user: {
      id: number
      email: string
    } | null
  }

  let { user }: Props = $props()
</script>

<header class="header">
  <nav class="header__nav">
    {#if user}
      <span class="header__email">{user.email}</span>
      <form method="POST" action="/auth/logout">
        <Button type="submit">Logout</Button>
      </form>
    {:else}
      <form method="POST" action="/auth/google">
        <Button type="submit">Login</Button>
      </form>
    {/if}
  </nav>
</header>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: var(--spacing-4);
    height: var(--header-height);
    background-color: var(--gray-700);
  }

  .header__nav {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
  }

  .header__email {
    color: var(--gray-100);
    font-size: 0.875rem;
  }
</style>
