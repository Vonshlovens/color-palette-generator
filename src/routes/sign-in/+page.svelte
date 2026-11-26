<script lang="ts">
  import { enhance } from '$app/forms';
  import GitHubMark from '$lib/components/GitHubMark.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import Hourglass from '@lucide/svelte/icons/hourglass';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import MailCheck from '@lucide/svelte/icons/mail-check';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  type Tab = 'signIn' | 'requestAccess';
  const tabs: { value: Tab; label: string }[] = [
    { value: 'signIn', label: 'Sign in' },
    { value: 'requestAccess', label: 'Request access' }
  ];

  // Follows the submitted form (also during SSR, so no-JS posts show their result); clicks override.
  let tab = $derived<Tab>(form?.form === 'requestAccess' ? 'requestAccess' : 'signIn');
  let submitting = $state(false);
  // The GitHub form posts without enhance: its 303 leaves the site for github.com.
  let startingGitHub = $state(false);
  const githubError = $derived(form?.form === 'github' && 'error' in form ? form.error : null);

  const submit = () => {
    submitting = true;
    return async ({ update }: { update: (options?: { reset?: boolean }) => Promise<void> }) => {
      await update({ reset: false });
      submitting = false;
    };
  };

  // A fixed spectrum strip: the sign-in page has no palette of its own.
  const strip = [
    'oklch(0.72 0.15 45)',
    'oklch(0.78 0.13 85)',
    'oklch(0.68 0.12 165)',
    'oklch(0.6 0.15 262)',
    'oklch(0.62 0.17 330)'
  ];

  const primaryButton =
    'bg-primary text-primary-foreground hover:bg-primary/85 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium shadow-[inset_0_1px_0_oklch(1_0_0/0.15),0_1px_2px_oklch(0_0_0/0.2)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60';
  const secondaryButton =
    'bg-card hover:bg-muted inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium shadow-[inset_0_1px_0_var(--panel-edge),0_1px_2px_oklch(0_0_0/0.08)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring';
  const githubButton = `${secondaryButton} h-10 w-full justify-center gap-2 disabled:pointer-events-none disabled:opacity-60`;
  const field = 'h-10 rounded-xl bg-card';
  const steps = $derived(
    data.githubEnabled
      ? [
          'Request access with your email, or continue with GitHub.',
          'The owner approves you; email requests get an email.',
          'Sign in with GitHub or a link that works once, for 15 minutes.'
        ]
      : [
          'Request access with your name and email.',
          'The owner approves you; you get an email.',
          'Sign in with a link that works once, for 15 minutes.'
        ]
  );
</script>

<svelte:head>
  <title>Sign in · Palette Studio</title>
  <meta name="robots" content="noindex" />
</svelte:head>

{#snippet confirmation(title: string, body: import('svelte').Snippet, icon = MailCheck)}
  {@const Icon = icon}
  <div class="space-y-4 py-2" role="status">
    <div
      class="well text-foreground grid size-11 place-items-center rounded-2xl"
      aria-hidden="true"
    >
      <Icon class="size-5" />
    </div>
    <h2 class="font-display text-2xl font-semibold">{title}</h2>
    <p class="text-muted-foreground text-sm leading-relaxed">{@render body()}</p>
  </div>
{/snippet}

<main class="mx-auto grid max-w-5xl gap-10 px-4 pt-8 pb-16 sm:px-6 sm:pt-12 lg:grid-cols-[1fr_26rem] lg:items-start lg:gap-16">
  <div class="lg:pt-6">
    <h1 class="font-display max-w-lg text-4xl leading-[0.98] font-semibold text-balance sm:text-6xl">
      Sign in to save palettes.
    </h1>
    <p class="text-muted-foreground mt-4 max-w-md text-[0.9375rem] leading-relaxed">
      Generating palettes is open to everyone. Saving and sharing them needs an account the owner
      approved. We email you a one-time sign-in link{data.githubEnabled ? ', or you can continue with GitHub' : ''},
      so there is no password to remember.
    </p>
    <ol class="text-muted-foreground mt-8 hidden max-w-md space-y-3 text-sm sm:block">
      {#each steps as step, index (step)}
        <li class="flex items-start gap-3">
          <span class="kbd mt-px shrink-0">{index + 1}</span>
          <span>{step}</span>
        </li>
      {/each}
    </ol>
  </div>

  <section class="panel overflow-hidden" aria-label="Account access">
    <div class="flex h-2" aria-hidden="true">
      {#each strip as color (color)}
        <span class="flex-1" style="background: {color}"></span>
      {/each}
    </div>

    <div class="space-y-6 p-5 sm:p-6">
      {#if data.accessRequested}
        {#snippet pendingBody()}
          Your GitHub sign-in is on the owner's approval list. You are not signed in yet; once the
          owner approves you, <strong class="text-foreground">Continue with GitHub</strong> signs you
          straight in.
        {/snippet}
        {@render confirmation('Access requested — waiting for owner approval', pendingBody, Hourglass)}
        <a class={secondaryButton} href="/sign-in?redirectTo={encodeURIComponent(data.redirectTo)}">
          Back to sign in
        </a>
      {:else}
        {#if data.linkError}
          <p
            class="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-xl border p-3 text-sm"
            role="alert"
          >
            <TriangleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {data.linkError}
          </p>
        {/if}

        {#if data.githubEnabled}
          <form method="POST" action="?/github" class="space-y-2" onsubmit={() => (startingGitHub = true)}>
            <input type="hidden" name="redirectTo" value={data.redirectTo} />
            <button type="submit" class={githubButton} disabled={startingGitHub}>
              {#if startingGitHub}
                <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
                Opening GitHub…
              {:else}
                <GitHubMark />
                Continue with GitHub
              {/if}
            </button>
            {#if githubError}
              <p class="text-destructive text-sm" role="alert">{githubError}</p>
            {/if}
          </form>
          <div class="text-muted-foreground flex items-center gap-3 text-xs" aria-hidden="true">
            <span class="bg-border h-px flex-1"></span>
            or with email
            <span class="bg-border h-px flex-1"></span>
          </div>
        {/if}

        <div class="segmented grid w-full grid-cols-2" role="tablist" aria-label="Account access">
          {#each tabs as option (option.value)}
            <button
              type="button"
              role="tab"
              id="tab-{option.value}"
              aria-controls="panel-{option.value}"
              aria-selected={tab === option.value}
              onclick={() => (tab = option.value)}
            >
              {option.label}
            </button>
          {/each}
        </div>

        {#if tab === 'signIn'}
          <div id="panel-signIn" role="tabpanel" aria-labelledby="tab-signIn">
            {#if form?.form === 'signIn' && 'sent' in form && form.sent}
              {#snippet sentBody()}
                If <strong class="text-foreground">{form?.email}</strong> has approved access, a
                sign-in link is on its way. It expires in 15 minutes and works once. No email? Your
                request may still be waiting for approval.
              {/snippet}
              {@render confirmation('Check your email', sentBody)}
              <a
                class="{secondaryButton} mt-5"
                href="/sign-in?redirectTo={encodeURIComponent(data.redirectTo)}"
              >
                Use a different email
              </a>
            {:else}
              <form method="POST" action="?/signIn" class="space-y-4" use:enhance={submit}>
                <input type="hidden" name="redirectTo" value={data.redirectTo} />
                <div class="space-y-2">
                  <Label for="sign-in-email">Email</Label>
                  <Input
                    id="sign-in-email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    placeholder="you@example.com"
                    required
                    class={field}
                    value={form?.form === 'signIn' ? form.email : ''}
                    aria-invalid={form?.form === 'signIn' && 'error' in form ? true : undefined}
                    aria-describedby="sign-in-status"
                  />
                </div>
                <p id="sign-in-status" class="text-destructive min-h-5 text-sm" role="alert">
                  {form?.form === 'signIn' && 'error' in form ? form.error : ''}
                </p>
                <button type="submit" class={primaryButton} disabled={submitting}>
                  {#if submitting}
                    <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
                    Sending…
                  {:else}
                    Email me a sign-in link
                  {/if}
                </button>
                <p class="text-muted-foreground text-center text-xs">For approved accounts.</p>
              </form>
            {/if}
          </div>
        {:else}
          <div id="panel-requestAccess" role="tabpanel" aria-labelledby="tab-requestAccess">
            {#if form?.form === 'requestAccess' && 'requested' in form && form.requested}
              {#snippet requestedBody()}
                The owner will review access for <strong class="text-foreground">{form?.email}</strong
                >. Once approved, you will get an email and can sign in from this page.
              {/snippet}
              {@render confirmation('Request received', requestedBody)}
            {:else}
              <form method="POST" action="?/requestAccess" class="space-y-4" use:enhance={submit}>
                <div class="space-y-2">
                  <Label for="request-name">Name</Label>
                  <Input
                    id="request-name"
                    name="name"
                    autocomplete="name"
                    maxlength={80}
                    required
                    class={field}
                    value={form?.form === 'requestAccess' && 'name' in form ? form.name : ''}
                  />
                </div>
                <div class="space-y-2">
                  <Label for="request-email">Email</Label>
                  <Input
                    id="request-email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    placeholder="you@example.com"
                    required
                    class={field}
                    value={form?.form === 'requestAccess' ? form.email : ''}
                    aria-describedby="request-status"
                  />
                </div>
                <p id="request-status" class="text-destructive min-h-5 text-sm" role="alert">
                  {form?.form === 'requestAccess' && 'error' in form ? form.error : ''}
                </p>
                <button type="submit" class={primaryButton} disabled={submitting}>
                  {#if submitting}
                    <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
                    Sending…
                  {:else}
                    Request access
                  {/if}
                </button>
                <p class="text-muted-foreground text-center text-xs">
                  New accounts stay pending until the owner approves them. No email is sent until then.
                </p>
              </form>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  </section>
</main>
