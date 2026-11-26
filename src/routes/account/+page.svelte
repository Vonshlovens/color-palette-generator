<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import GitHubMark from '$lib/components/GitHubMark.svelte';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import Mail from '@lucide/svelte/icons/mail';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  const user = $derived(page.data.user!);
  // Connecting posts without enhance: its 303 leaves the site for github.com.
  let connecting = $state(false);
  let disconnecting = $state(false);

  const error = $derived((form && 'error' in form ? form.error : null) ?? data.connectError);
  const notice = $derived(
    form && 'disconnected' in form
      ? 'GitHub is disconnected. Sign in with an email link from now on.'
      : data.justConnected
        ? `GitHub is connected. Continue with GitHub now signs you in as ${user.email}.`
        : null
  );

  const button =
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60';
  const connectButton = `${button} bg-primary text-primary-foreground hover:bg-primary/85 shadow-[inset_0_1px_0_oklch(1_0_0/0.15),0_1px_2px_oklch(0_0_0/0.2)]`;
  const quietButton = `${button} bg-card border hover:bg-muted shadow-[inset_0_1px_0_var(--panel-edge),0_1px_2px_oklch(0_0_0/0.08)]`;
</script>

<svelte:head>
  <title>Account · Palette Studio</title>
  <meta name="robots" content="noindex" />
</svelte:head>

{#snippet method(title: string, detail: string, connected: boolean, icon: import('svelte').Snippet, action?: import('svelte').Snippet)}
  <li class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
    <div class="flex min-w-0 items-center gap-3">
      <span class="well text-foreground grid size-9 shrink-0 place-items-center rounded-xl" aria-hidden="true">
        {@render icon()}
      </span>
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p class="text-sm font-medium">{title}</p>
          <span class="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <span
              class="size-1.5 rounded-full {connected ? 'bg-emerald-500' : 'bg-muted-foreground/40'}"
              aria-hidden="true"
            ></span>
            {connected ? 'Connected' : 'Not connected'}
          </span>
        </div>
        <p class="text-muted-foreground truncate text-sm">{detail}</p>
      </div>
    </div>
    {@render action?.()}
  </li>
{/snippet}

<main class="mx-auto max-w-3xl space-y-6 px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
  <div class="max-w-xl">
    <h1 class="font-display text-4xl leading-[0.98] font-semibold sm:text-6xl">Account</h1>
    <p class="text-muted-foreground mt-3 text-[0.9375rem] leading-relaxed">
      Signed in as <strong class="text-foreground font-medium">{user.email}</strong>. Every sign-in
      method below opens this same account and its palettes.
    </p>
  </div>

  {#if notice}
    <p class="well flex items-start gap-2 rounded-xl px-4 py-3 text-sm" role="status">
      <CircleCheck class="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      {notice}
    </p>
  {:else if error}
    <p
      class="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
      role="alert"
    >
      <TriangleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {error}
    </p>
  {/if}

  <section class="panel overflow-hidden" aria-label="Sign-in methods">
    <header class="px-5 pt-5 pb-4 sm:px-6">
      <h2 class="font-display text-xl font-semibold">Sign-in methods</h2>
      <p class="text-muted-foreground mt-0.5 text-sm">
        {data.githubEnabled
          ? 'Connect GitHub to sign in with one click. Its email can differ from yours.'
          : 'Sign in with a one-time link sent to your email.'}
      </p>
    </header>
    <ul class="divide-y border-t">
      {#snippet mailIcon()}<Mail class="size-4" />{/snippet}
      {@render method('Email link', user.email, true, mailIcon)}

      {#if data.githubEnabled || data.github}
        {#snippet githubIcon()}<GitHubMark />{/snippet}
        {#snippet githubAction()}
          {#if data.github}
            <form
              method="POST"
              action="?/disconnectGitHub"
              use:enhance={() => {
                disconnecting = true;
                return async ({ update }) => {
                  await update();
                  disconnecting = false;
                };
              }}
            >
              <button type="submit" class={quietButton} disabled={disconnecting}>
                {#if disconnecting}<LoaderCircle class="size-4 animate-spin" aria-hidden="true" />{/if}
                Disconnect
              </button>
            </form>
          {:else}
            <form method="POST" action="?/connectGitHub" onsubmit={() => (connecting = true)}>
              <button type="submit" class={connectButton} disabled={connecting}>
                {#if connecting}
                  <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
                  Opening GitHub…
                {:else}
                  <GitHubMark class="size-3.5" />
                  Connect GitHub
                {/if}
              </button>
            </form>
          {/if}
        {/snippet}
        {@render method(
          'GitHub',
          data.github
            ? `Connected ${data.github.connectedAt.slice(0, 10)}. The email link still works.`
            : 'Sign in with your GitHub login.',
          data.github !== null,
          githubIcon,
          githubAction
        )}
      {/if}
    </ul>
  </section>
</main>
