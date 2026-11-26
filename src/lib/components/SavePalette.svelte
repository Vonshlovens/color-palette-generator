<script lang="ts">
  import { page } from '$app/state';
  import { getPaletteStoreContext } from '$lib/stores/palette.svelte';
  import { getHarmonyName } from '$lib/color/harmonies';
  import type { SavedPalette } from '$lib/types';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import CopyButton from './CopyButton.svelte';
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  import Check from '@lucide/svelte/icons/check';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import Link2 from '@lucide/svelte/icons/link-2';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import LogIn from '@lucide/svelte/icons/log-in';
  import Save from '@lucide/svelte/icons/save';

  const paletteStore = getPaletteStoreContext();
  const signInHref = $derived(
    `/sign-in?redirectTo=${encodeURIComponent(page.url.pathname + page.url.search)}`
  );
  let open = $state(false);
  let wasOpen = false;
  let name = $state('');
  let loading = $state(false);
  let errorMessage = $state('');
  /** The palette this dialog just saved; the studio keeps its state either way. */
  let saved = $state<SavedPalette | null>(null);
  const savedUrl = $derived(saved ? `${page.url.origin}/palettes/${saved.slug}` : '');

  $effect(() => {
    if (open && !wasOpen) {
      name = `${getHarmonyName(paletteStore.harmony)} palette`;
      errorMessage = '';
      saved = null;
    }
    wasOpen = open;
  });

  async function savePalette(event: SubmitEvent) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      errorMessage = 'Enter a name for this palette.';
      return;
    }

    loading = true;
    errorMessage = '';

    try {
      const response = await fetch('/api/palettes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, ...paletteStore.snapshot() })
      });
      const body = (await response.json()) as {
        palette?: SavedPalette;
        error?: { message?: string };
      };

      if (!response.ok || !body.palette?.slug) {
        throw new Error(body.error?.message ?? 'Unable to save the palette.');
      }

      // Stay put: the palette being worked on is still the user's, so they can keep going.
      saved = body.palette;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to save the palette.';
    } finally {
      loading = false;
    }
  }
</script>

{#if !page.data.user}
  <!-- Saving writes to the database, so it needs an approved account; generating does not. -->
  <a
    href={signInHref}
    title="Saving and sharing needs an approved account"
    class="bg-card hover:bg-muted group inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xl border px-3 text-sm font-medium shadow-[inset_0_1px_0_var(--panel-edge),0_1px_2px_oklch(0_0_0/0.08)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <span class="flex -space-x-1" aria-hidden="true">
      {#each paletteStore.colors.slice(0, 3) as color, index (index)}
        <span
          class="ring-card size-3 rounded-full ring-2"
          style="background: {color.hex}"
        ></span>
      {/each}
    </span>
    <LogIn class="text-muted-foreground group-hover:text-foreground size-4 transition-colors" aria-hidden="true" />
    Sign in to save
  </a>
{:else}
  <Dialog.Root bind:open>
    <Dialog.Trigger>
      {#snippet child({ props })}
        <button
          {...props}
          type="button"
          class="bg-card hover:bg-muted inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium shadow-[inset_0_1px_0_var(--panel-edge),0_1px_2px_oklch(0_0_0/0.08)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Save class="size-4" aria-hidden="true" />
          Save
        </button>
      {/snippet}
    </Dialog.Trigger>
    <Dialog.Content class="rounded-3xl">
      <div class="-mx-6 -mt-6 flex h-20 overflow-hidden rounded-t-3xl" aria-hidden="true">
        {#each paletteStore.colors as color, index (index)}
          <span class="flex-1" style="background: {color.hex}"></span>
        {/each}
      </div>
      {#if saved}
        <Dialog.Header>
          <Dialog.Title class="font-display flex items-center gap-2 text-xl">
            <CircleCheck class="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Saved
          </Dialog.Title>
          <Dialog.Description>
            <span class="text-foreground font-medium">{saved.name}</span> is in the gallery with
            exactly these {saved.colors.length} colors. Your workspace is unchanged, so keep going.
          </Dialog.Description>
        </Dialog.Header>

        <div class="well flex items-center gap-2 rounded-xl py-1 pr-1 pl-3" role="status">
          <span class="min-w-0 flex-1 truncate font-mono text-xs">{savedUrl}</span>
          <CopyButton
            value={savedUrl}
            label="share link"
            class="bg-card hover:bg-muted inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium shadow-[inset_0_1px_0_var(--panel-edge),0_1px_2px_oklch(0_0_0/0.12)] transition-colors"
          >
            {#snippet children(copied)}
              {#if copied}
                <Check class="size-4" aria-hidden="true" /> Copied
              {:else}
                <Link2 class="size-4" aria-hidden="true" /> Copy link
              {/if}
            {/snippet}
          </CopyButton>
        </div>

        <Dialog.Footer class="gap-2 sm:justify-between">
          <a
            href="/palettes/{saved.slug}"
            class="text-muted-foreground hover:text-foreground inline-flex h-9 items-center gap-1 rounded-lg px-1 text-sm font-medium underline-offset-4 hover:underline"
          >
            View saved palette
            <ArrowUpRight class="size-4" aria-hidden="true" />
          </a>
          <Button onclick={() => (open = false)}>Keep editing</Button>
        </Dialog.Footer>
      {:else}
        <Dialog.Header>
          <Dialog.Title class="font-display text-xl">Save palette</Dialog.Title>
          <Dialog.Description>
            Saves these exact colors with a public link you can share. Your workspace stays as it is.
          </Dialog.Description>
        </Dialog.Header>

        <form class="space-y-4" onsubmit={savePalette}>
          <div class="space-y-2">
            <Label for="palette-name">Palette name</Label>
            <Input
              id="palette-name"
              bind:value={name}
              maxlength={80}
              autocomplete="off"
              disabled={loading}
              aria-invalid={Boolean(errorMessage)}
              aria-describedby="save-palette-status"
            />
          </div>

          <p
            id="save-palette-status"
            class={errorMessage ? 'text-destructive text-sm' : 'sr-only'}
            role={errorMessage ? 'alert' : 'status'}
            aria-live="polite"
          >
            {errorMessage}
          </p>

          <Dialog.Footer>
            <Button type="submit" disabled={loading}>
              {#if loading}
                <LoaderCircle class="animate-spin" data-icon="inline-start" />
                Saving…
              {:else}
                <Save data-icon="inline-start" />
                Save
              {/if}
            </Button>
          </Dialog.Footer>
        </form>
      {/if}
    </Dialog.Content>
  </Dialog.Root>
{/if}
