<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  type User = (typeof data.users)[number];
  type Status = User['status'];

  const STATUS_LABELS: Record<Status, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    revoked: 'Revoked'
  };
  // A small status dot keeps the list calm; color is never the only signal (the label is text).
  const STATUS_DOTS: Record<Status, string> = {
    pending: 'bg-amber-500',
    approved: 'bg-emerald-500',
    rejected: 'bg-destructive',
    revoked: 'bg-destructive'
  };

  const pending = $derived(data.users.filter((user) => user.status === 'pending'));
  const others = $derived(data.users.filter((user) => user.status !== 'pending'));
  const approvedCount = $derived(data.users.filter((user) => user.status === 'approved').length);

  const button =
    'inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring';
  const approveButton = `${button} bg-primary text-primary-foreground hover:bg-primary/85 shadow-[inset_0_1px_0_oklch(1_0_0/0.15),0_1px_2px_oklch(0_0_0/0.2)]`;
  const quietButton = `${button} bg-card border hover:bg-muted shadow-[inset_0_1px_0_var(--panel-edge),0_1px_2px_oklch(0_0_0/0.08)]`;
  const dangerButton = `${button} bg-destructive/10 text-destructive hover:bg-destructive/20`;
</script>

<svelte:head>
  <title>Approvals · Palette Studio</title>
  <meta name="robots" content="noindex" />
</svelte:head>

{#snippet actions(user: User)}
  {#if user.isOwner}
    <span class="kbd px-2">Owner</span>
  {:else}
    <form method="POST" class="flex flex-wrap justify-end gap-2" use:enhance>
      <input type="hidden" name="userId" value={user.id} />
      {#if user.status !== 'approved'}
        <button type="submit" class={approveButton} formaction="?/approve">Approve</button>
      {/if}
      {#if user.status === 'pending'}
        <button type="submit" class={quietButton} formaction="?/reject">Reject</button>
      {/if}
      {#if user.status === 'approved'}
        <button type="submit" class={dangerButton} formaction="?/revoke">Revoke</button>
      {/if}
    </form>
  {/if}
{/snippet}

{#snippet userList(title: string, description: string, users: User[], empty: string)}
  <section class="panel overflow-hidden" aria-label={title}>
    <header class="flex items-baseline justify-between gap-4 px-5 pt-5 pb-4 sm:px-6">
      <div>
        <h2 class="font-display text-xl font-semibold">{title}</h2>
        <p class="text-muted-foreground mt-0.5 text-sm">{description}</p>
      </div>
      <span class="tabular text-muted-foreground font-mono text-sm">{users.length}</span>
    </header>
    {#if users.length === 0}
      <p class="well text-muted-foreground mx-5 mb-5 rounded-xl px-4 py-6 text-center text-sm sm:mx-6 sm:mb-6">
        {empty}
      </p>
    {:else}
      <ul class="divide-y border-t">
        {#each users as user (user.id)}
          <li class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="well text-foreground grid size-9 shrink-0 place-items-center rounded-xl font-mono text-xs font-semibold uppercase"
                aria-hidden="true"
              >
                {(user.name || user.email).charAt(0)}
              </span>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p class="truncate text-sm font-medium">{user.name || user.email}</p>
                  <span class="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                    <span class="size-1.5 rounded-full {STATUS_DOTS[user.status]}" aria-hidden="true"></span>
                    {STATUS_LABELS[user.status]}
                  </span>
                </div>
                <p class="text-muted-foreground truncate text-sm">
                  {user.email}
                  <span aria-hidden="true">·</span>
                  <time class="tabular font-mono text-xs" datetime={user.requestedAt}>
                    {user.requestedAt.slice(0, 10)}
                  </time>
                </p>
              </div>
            </div>
            {@render actions(user)}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
{/snippet}

<main class="mx-auto max-w-3xl space-y-6 px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="max-w-xl">
      <h1 class="font-display text-4xl leading-[0.98] font-semibold sm:text-6xl">Approvals</h1>
      <p class="text-muted-foreground mt-3 text-[0.9375rem] leading-relaxed">
        Approved people can sign in with a magic link and save palettes. Rejecting or revoking signs
        them out everywhere.
      </p>
    </div>
    <dl class="well flex shrink-0 gap-5 rounded-2xl px-4 py-2.5 text-sm">
      <div>
        <dt class="text-muted-foreground text-xs">Pending</dt>
        <dd class="tabular font-mono text-base font-semibold">{pending.length}</dd>
      </div>
      <div>
        <dt class="text-muted-foreground text-xs">Approved</dt>
        <dd class="tabular font-mono text-base font-semibold">{approvedCount}</dd>
      </div>
    </dl>
  </div>

  {#if form && 'updated' in form && form.updated}
    <p class="well rounded-xl px-4 py-3 text-sm" role="status">
      <strong class="font-medium">{form.updated.email}</strong> is now
      {STATUS_LABELS[form.updated.status].toLowerCase()}.
    </p>
  {:else if form && 'error' in form}
    <p class="border-destructive/30 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm" role="alert">
      {form.error}
    </p>
  {/if}

  {@render userList('Pending requests', 'People waiting for access.', pending, 'No one is waiting for approval.')}
  {@render userList('Everyone else', 'Approved, rejected, and revoked accounts.', others, 'No other accounts yet.')}
</main>
