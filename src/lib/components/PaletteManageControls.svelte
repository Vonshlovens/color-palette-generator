<script lang="ts">
  import type { SavedPalette } from '$lib/types';
  import { Button } from '$lib/components/ui/button';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Trash2 from '@lucide/svelte/icons/trash-2';

  interface Props {
    slug: string;
    name: string;
    /** Icon-only buttons for gallery cards; labeled buttons on the palette page. */
    compact?: boolean;
    onRenamed: (palette: SavedPalette) => void;
    onDeleted: () => void;
  }

  let { slug, name, compact = false, onRenamed, onDeleted }: Props = $props();

  let renameOpen = $state(false);
  let deleteOpen = $state(false);
  let draft = $state('');
  let busy = $state(false);
  let errorMessage = $state('');

  function openRename() {
    draft = name;
    errorMessage = '';
    renameOpen = true;
  }

  function openDelete() {
    errorMessage = '';
    deleteOpen = true;
  }

  async function request(method: 'PATCH' | 'DELETE', body?: unknown): Promise<Response> {
    const response = await fetch(`/api/palettes/${slug}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(payload.error?.message ?? 'Something went wrong. Try again.');
    }
    return response;
  }

  async function rename(event: SubmitEvent) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      errorMessage = 'Enter a name for this palette.';
      return;
    }
    if (trimmed === name) {
      renameOpen = false;
      return;
    }
    busy = true;
    errorMessage = '';
    try {
      const response = await request('PATCH', { name: trimmed });
      const { palette } = (await response.json()) as { palette: SavedPalette };
      renameOpen = false;
      onRenamed(palette);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to rename the palette.';
    } finally {
      busy = false;
    }
  }

  async function remove() {
    busy = true;
    errorMessage = '';
    try {
      await request('DELETE');
      deleteOpen = false;
      onDeleted();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unable to delete the palette.';
    } finally {
      busy = false;
    }
  }

  const iconButton =
    'text-muted-foreground hover:text-foreground hover:bg-muted relative z-10 grid size-8 shrink-0 place-items-center rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring';
  const labeledButton =
    'bg-card hover:bg-muted inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium shadow-[inset_0_1px_0_var(--panel-edge),0_1px_2px_oklch(0_0_0/0.08)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring';
</script>

<button
  type="button"
  class={compact ? iconButton : labeledButton}
  onclick={openRename}
  aria-label="Rename {name}"
  title="Rename"
>
  <Pencil class="size-4" aria-hidden="true" />
  {#if !compact}Rename{/if}
</button>
<button
  type="button"
  class={compact
    ? `${iconButton} hover:!text-destructive`
    : `${labeledButton} text-destructive hover:bg-destructive/10`}
  onclick={openDelete}
  aria-label="Delete {name}"
  title="Delete"
>
  <Trash2 class="size-4" aria-hidden="true" />
  {#if !compact}Delete{/if}
</button>

<Dialog.Root bind:open={renameOpen}>
  <Dialog.Content class="rounded-3xl">
    <Dialog.Header>
      <Dialog.Title class="font-display text-xl">Rename palette</Dialog.Title>
      <Dialog.Description>The colors and share link stay the same.</Dialog.Description>
    </Dialog.Header>
    <form class="space-y-4" onsubmit={rename}>
      <div class="space-y-2">
        <Label for="rename-{slug}">Palette name</Label>
        <Input
          id="rename-{slug}"
          bind:value={draft}
          maxlength={80}
          autocomplete="off"
          disabled={busy}
          aria-invalid={Boolean(errorMessage)}
        />
      </div>
      {#if errorMessage}
        <p class="text-destructive text-sm" role="alert">{errorMessage}</p>
      {/if}
      <Dialog.Footer>
        <Button type="button" variant="ghost" onclick={() => (renameOpen = false)}>Cancel</Button>
        <Button type="submit" disabled={busy}>
          {#if busy}<LoaderCircle class="animate-spin" data-icon="inline-start" />{/if}
          Save name
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={deleteOpen}>
  <Dialog.Content class="rounded-3xl">
    <Dialog.Header>
      <Dialog.Title class="font-display text-xl">Delete “{name}”?</Dialog.Title>
      <Dialog.Description>
        This removes it from the gallery and breaks its share link for everyone. It can’t be undone.
      </Dialog.Description>
    </Dialog.Header>
    {#if errorMessage}
      <p class="text-destructive text-sm" role="alert">{errorMessage}</p>
    {/if}
    <Dialog.Footer>
      <Button type="button" variant="ghost" onclick={() => (deleteOpen = false)}>Keep it</Button>
      <Button
        type="button"
        class="bg-destructive hover:bg-destructive/85 text-white"
        disabled={busy}
        onclick={remove}
      >
        {#if busy}
          <LoaderCircle class="animate-spin" data-icon="inline-start" />
        {:else}
          <Trash2 data-icon="inline-start" />
        {/if}
        Delete palette
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
