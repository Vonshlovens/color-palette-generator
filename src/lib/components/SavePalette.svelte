<script lang="ts">
  import { goto } from '$app/navigation';
  import { getPaletteStoreContext } from '$lib/stores/palette.svelte';
  import { getHarmonyName } from '$lib/color/harmonies';
  import type { SavedPalette } from '$lib/types';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import Save from '@lucide/svelte/icons/save';

  const paletteStore = getPaletteStoreContext();
  let open = $state(false);
  let wasOpen = false;
  let name = $state('');
  let loading = $state(false);
  let errorMessage = $state('');
  let successMessage = $state('');

  $effect(() => {
    if (open && !wasOpen) {
      name = `${getHarmonyName(paletteStore.harmony)} palette`;
      errorMessage = '';
      successMessage = '';
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
    successMessage = '';

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

      successMessage = 'Palette saved. Opening its share link…';
      await new Promise((resolve) => setTimeout(resolve, 250));
      await goto(`/palettes/${body.palette.slug}`);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to save the palette.';
    } finally {
      loading = false;
    }
  }
</script>

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
    <Dialog.Header>
      <Dialog.Title class="font-display text-xl">Save palette</Dialog.Title>
      <Dialog.Description>
        Create an immutable snapshot and a public link you can share.
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
        class={errorMessage ? 'text-destructive text-sm' : 'text-muted-foreground text-sm'}
        role={errorMessage ? 'alert' : 'status'}
        aria-live="polite"
      >
        {errorMessage || successMessage}
      </p>

      <Dialog.Footer>
        <Button type="submit" disabled={loading || Boolean(successMessage)}>
          {#if loading}
            <LoaderCircle class="animate-spin" data-icon="inline-start" />
            Saving…
          {:else}
            <Save data-icon="inline-start" />
            Save and share
          {/if}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
