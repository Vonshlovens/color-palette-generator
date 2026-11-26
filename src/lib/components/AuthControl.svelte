<script lang="ts">
  import { page } from '$app/state';
  import LogIn from '@lucide/svelte/icons/log-in';
  import LogOut from '@lucide/svelte/icons/log-out';
  import ShieldCheck from '@lucide/svelte/icons/shield-check';

  const user = $derived(page.data.user);
  const signInHref = $derived(
    `/sign-in?redirectTo=${encodeURIComponent(page.url.pathname + page.url.search)}`
  );
</script>

{#if user}
  <!-- The sign-out form sits outside the segmented well so its button stays a direct child. -->
  <form id="sign-out-form" method="POST" action="/sign-out" class="hidden"></form>
  <div class="segmented" role="group" aria-label="Account">
    <span
      class="bg-card text-foreground grid size-8 place-items-center rounded-lg font-mono text-xs font-semibold uppercase shadow-[inset_0_1px_0_var(--panel-edge),0_1px_2px_oklch(0_0_0/0.12)]"
      title="Signed in as {user.email}"
    >
      <span class="sr-only">Signed in as {user.email}</span>
      <span aria-hidden="true">{user.email.charAt(0)}</span>
    </span>
    {#if user.isOwner}
      <a
        href="/approvals"
        aria-current={page.url.pathname.startsWith('/approvals') ? 'page' : undefined}
        title="Approvals"
      >
        <ShieldCheck class="size-4" aria-hidden="true" />
        <span class="hidden md:inline">Approvals</span>
      </a>
    {/if}
    <button type="submit" form="sign-out-form" title="Sign out {user.email}">
      <LogOut class="size-4" aria-hidden="true" />
      <span class="hidden md:inline">Sign out</span>
    </button>
  </div>
{:else if page.url.pathname !== '/sign-in'}
  <a
    href={signInHref}
    class="bg-card hover:bg-muted inline-flex h-9 shrink-0 items-center whitespace-nowrap gap-1.5 rounded-xl border px-3 text-sm font-medium shadow-[inset_0_1px_0_var(--panel-edge),0_1px_2px_oklch(0_0_0/0.08)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <LogIn class="size-4" aria-hidden="true" />
    Sign in
  </a>
{/if}
