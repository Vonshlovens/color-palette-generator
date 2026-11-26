<script lang="ts">
  import { enhance } from '$app/forms';
  import { AuthControl, ThemeControl } from '$lib/components';
  import { Badge, type BadgeVariant } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import Palette from '@lucide/svelte/icons/palette';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  type Status = (typeof data.users)[number]['status'];

  const STATUS_LABELS: Record<Status, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    revoked: 'Revoked'
  };
  const STATUS_VARIANTS: Record<Status, BadgeVariant> = {
    pending: 'secondary',
    approved: 'default',
    rejected: 'destructive',
    revoked: 'destructive'
  };

  const pending = $derived(data.users.filter((user) => user.status === 'pending'));
  const others = $derived(data.users.filter((user) => user.status !== 'pending'));
</script>

<svelte:head>
  <title>Approvals · Palette Studio</title>
  <meta name="robots" content="noindex" />
</svelte:head>

{#snippet actions(user: (typeof data.users)[number])}
  {#if user.isOwner}
    <span class="text-muted-foreground text-xs">Owner</span>
  {:else}
    <form method="POST" class="flex flex-wrap justify-end gap-2" use:enhance>
      <input type="hidden" name="userId" value={user.id} />
      {#if user.status !== 'approved'}
        <Button type="submit" size="sm" formaction="?/approve">Approve</Button>
      {/if}
      {#if user.status === 'pending'}
        <Button type="submit" size="sm" variant="outline" formaction="?/reject">Reject</Button>
      {/if}
      {#if user.status === 'approved'}
        <Button type="submit" size="sm" variant="destructive" formaction="?/revoke">Revoke</Button>
      {/if}
    </form>
  {/if}
{/snippet}

{#snippet userList(users: typeof data.users, empty: string)}
  {#if users.length === 0}
    <p class="text-muted-foreground px-6 pb-6 text-sm">{empty}</p>
  {:else}
    <ul class="divide-y border-t">
      {#each users as user (user.id)}
        <li class="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <p class="truncate text-sm font-medium">{user.name || user.email}</p>
              <Badge variant={STATUS_VARIANTS[user.status]}>{STATUS_LABELS[user.status]}</Badge>
            </div>
            <p class="text-muted-foreground truncate text-sm">{user.email}</p>
            <p class="text-muted-foreground text-xs">
              Requested <time datetime={user.requestedAt}>{user.requestedAt.slice(0, 10)}</time>
            </p>
          </div>
          {@render actions(user)}
        </li>
      {/each}
    </ul>
  {/if}
{/snippet}

<div class="min-h-screen">
  <header class="border-b bg-background/90 sticky top-0 z-40 backdrop-blur">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
      <a class="flex min-w-0 items-center gap-3" href="/" aria-label="Palette Studio home">
        <span
          class="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-xl"
        >
          <Palette class="size-5" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold sm:text-base">Palette Studio</p>
          <p class="text-muted-foreground hidden text-xs sm:block">Color harmony workspace</p>
        </div>
      </a>
      <div class="flex items-center gap-2">
        <AuthControl />
        <ThemeControl />
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
    <div>
      <Badge variant="outline" class="mb-3">Owner</Badge>
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Approvals</h1>
      <p class="text-muted-foreground mt-2 text-sm leading-relaxed">
        Approved people can sign in with a magic link and save palettes. Rejecting or revoking signs
        them out everywhere.
      </p>
    </div>

    {#if form && 'updated' in form && form.updated}
      <p class="bg-muted rounded-lg p-3 text-sm" role="status">
        {form.updated.email} is now {STATUS_LABELS[form.updated.status].toLowerCase()}.
      </p>
    {:else if form && 'error' in form}
      <p class="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm" role="alert">
        {form.error}
      </p>
    {/if}

    <Card.Root class="gap-0 pb-0">
      <Card.Header class="pb-4">
        <Card.Title>Pending requests ({pending.length})</Card.Title>
        <Card.Description>People waiting for access.</Card.Description>
      </Card.Header>
      {@render userList(pending, 'No one is waiting for approval.')}
    </Card.Root>

    <Card.Root class="gap-0 pb-0">
      <Card.Header class="pb-4">
        <Card.Title>Everyone else ({others.length})</Card.Title>
        <Card.Description>Approved, rejected, and revoked accounts.</Card.Description>
      </Card.Header>
      {@render userList(others, 'No other accounts yet.')}
    </Card.Root>
  </main>
</div>
