<script lang="ts">
  import { enhance } from '$app/forms';
  import { ThemeControl } from '$lib/components';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Tabs from '$lib/components/ui/tabs';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import MailCheck from '@lucide/svelte/icons/mail-check';
  import Palette from '@lucide/svelte/icons/palette';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();

  let tab = $state<'signIn' | 'requestAccess'>('signIn');
  let submitting = $state(false);

  $effect(() => {
    if (form?.form) tab = form.form;
  });

  const submit = () => {
    submitting = true;
    return async ({ update }: { update: (options?: { reset?: boolean }) => Promise<void> }) => {
      await update({ reset: false });
      submitting = false;
    };
  };
</script>

<svelte:head>
  <title>Sign in · Palette Studio</title>
  <meta name="robots" content="noindex" />
</svelte:head>

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
      <ThemeControl />
    </div>
  </header>

  <main class="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 sm:py-16">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Sign in to save palettes</h1>
      <p class="text-muted-foreground mt-2 text-sm leading-relaxed">
        Generating palettes is open to everyone. Saving and sharing them needs an account approved
        by the owner. We email you a one-time sign-in link — no password.
      </p>
    </div>

    {#if data.linkError}
      <p class="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm" role="alert">
        {data.linkError}
      </p>
    {/if}

    <Tabs.Root bind:value={tab}>
      <Tabs.List class="w-full">
        <Tabs.Trigger value="signIn">Sign in</Tabs.Trigger>
        <Tabs.Trigger value="requestAccess">Request access</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="signIn">
        <Card.Root>
          {#if form?.form === 'signIn' && 'sent' in form && form.sent}
            <Card.Header>
              <div class="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-xl">
                <MailCheck class="size-5" aria-hidden="true" />
              </div>
              <Card.Title>Check your email</Card.Title>
              <Card.Description role="status">
                If <strong class="text-foreground">{form.email}</strong> has approved access, a sign-in
                link is on its way. It expires in 15 minutes and works once. No email? Your request may
                still be waiting for approval.
              </Card.Description>
            </Card.Header>
            <Card.Footer>
              <Button variant="outline" size="sm" href="/sign-in?redirectTo={encodeURIComponent(data.redirectTo)}">
                Use a different email
              </Button>
            </Card.Footer>
          {:else}
            <Card.Header>
              <Card.Title>Email me a sign-in link</Card.Title>
              <Card.Description>For approved accounts.</Card.Description>
            </Card.Header>
            <Card.Content>
              <form method="POST" action="?/signIn" class="space-y-4" use:enhance={submit}>
                <input type="hidden" name="redirectTo" value={data.redirectTo} />
                <div class="space-y-2">
                  <Label for="sign-in-email">Email</Label>
                  <Input
                    id="sign-in-email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    required
                    value={form?.form === 'signIn' ? form.email : ''}
                    aria-invalid={form?.form === 'signIn' && 'error' in form ? true : undefined}
                    aria-describedby="sign-in-status"
                  />
                </div>
                <p id="sign-in-status" class="text-destructive text-sm" role="alert">
                  {form?.form === 'signIn' && 'error' in form ? form.error : ''}
                </p>
                <Button type="submit" class="w-full" disabled={submitting}>
                  {#if submitting}
                    <LoaderCircle class="animate-spin" data-icon="inline-start" />
                    Sending…
                  {:else}
                    Send sign-in link
                  {/if}
                </Button>
              </form>
            </Card.Content>
          {/if}
        </Card.Root>
      </Tabs.Content>

      <Tabs.Content value="requestAccess">
        <Card.Root>
          {#if form?.form === 'requestAccess' && 'requested' in form && form.requested}
            <Card.Header>
              <div class="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-xl">
                <MailCheck class="size-5" aria-hidden="true" />
              </div>
              <Card.Title>Request received</Card.Title>
              <Card.Description role="status">
                The owner will review access for <strong class="text-foreground">{form.email}</strong>.
                Once approved, you will get an email and can sign in from this page.
              </Card.Description>
            </Card.Header>
          {:else}
            <Card.Header>
              <Card.Title>Request access</Card.Title>
              <Card.Description>
                New accounts stay pending until the owner approves them. No email is sent until then.
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <form method="POST" action="?/requestAccess" class="space-y-4" use:enhance={submit}>
                <div class="space-y-2">
                  <Label for="request-name">Name</Label>
                  <Input
                    id="request-name"
                    name="name"
                    autocomplete="name"
                    maxlength={80}
                    required
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
                    required
                    value={form?.form === 'requestAccess' ? form.email : ''}
                    aria-describedby="request-status"
                  />
                </div>
                <p id="request-status" class="text-destructive text-sm" role="alert">
                  {form?.form === 'requestAccess' && 'error' in form ? form.error : ''}
                </p>
                <Button type="submit" class="w-full" disabled={submitting}>
                  {#if submitting}
                    <LoaderCircle class="animate-spin" data-icon="inline-start" />
                    Sending…
                  {:else}
                    Request access
                  {/if}
                </Button>
              </form>
            </Card.Content>
          {/if}
        </Card.Root>
      </Tabs.Content>
    </Tabs.Root>
  </main>
</div>
