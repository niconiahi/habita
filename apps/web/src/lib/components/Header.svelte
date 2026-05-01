<script lang="ts">
  import Notifications from "$lib/components/Notifications.svelte"
  import UserPopover from "$lib/components/UserPopover.svelte"
  import HabitaFull from "$icon/habita/Full.svelte"

  interface Props {
    is_manager: boolean
    user: {
      name: string | null
      email: string
      surname: string | null
      image: string | null
    } | null
  }

  let { is_manager, user }: Props = $props()
</script>

<header>
  <div class="container">
    <a href="/" class="logo" aria-label="hábita">
      <HabitaFull />
    </a>
    <nav>
      {#if user}
        <UserPopover id="user-popover" {user} />
      {:else}
        <a
          class="button body-md-bold secondary"
          href="/login">Login</a
        >
      {/if}
      {#if is_manager}
        <Notifications />
      {/if}
    </nav>
  </div>
</header>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--dimension-spacing-2);
    background-color: var(--color-neutrals-50);
  }

  .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: var(--dimension-screen-lg);
  }

  .logo {
    text-decoration: none;
    border-radius: var(--dimension-radius-lg);
  }

  nav {
    display: flex;
    align-items: center;
    gap: var(--dimension-spacing-2-5);
  }

</style>
