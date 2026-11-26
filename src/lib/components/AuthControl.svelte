<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui/button';
  import LogIn from '@lucide/svelte/icons/log-in';
  import LogOut from '@lucide/svelte/icons/log-out';
  import ShieldCheck from '@lucide/svelte/icons/shield-check';

  const user = $derived(page.data.user);
  const signInHref = $derived(
    `/sign-in?redirectTo=${encodeURIComponent(page.url.pathname + page.url.search)}`
  );
</script>

{#if user}
  {#if user.isOwner}
    <Button variant="ghost" size="sm" href="/approvals">
      <ShieldCheck data-icon="inline-start" />
      <span class="hidden sm:inline">Approvals</span>
    </Button>
  {/if}
  <form method="POST" action="/sign-out">
    <Button type="submit" variant="ghost" size="sm" title="Sign out {user.email}">
      <LogOut data-icon="inline-start" />
      <span class="hidden sm:inline">Sign out</span>
    </Button>
  </form>
{:else if page.url.pathname !== '/sign-in'}
  <Button variant="ghost" size="sm" href={signInHref}>
    <LogIn data-icon="inline-start" />
    Sign in
  </Button>
{/if}
