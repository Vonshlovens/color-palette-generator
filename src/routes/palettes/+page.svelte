<script lang="ts">
  import { PaletteCard } from '$lib/components';
  import HarmonyGlyph from '$lib/components/HarmonyGlyph.svelte';
  import { getHarmonyName } from '$lib/color/harmonies';
  import { PALETTE_KINDS, type PaletteKind, type SavedPalette } from '$lib/types';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import Plus from '@lucide/svelte/icons/plus';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let extraPalettes = $state<SavedPalette[]>([]);
  /** null until the client paginates; the server-provided flag applies before that. */
  let clientHasMore = $state<boolean | null>(null);
  let loadingMore = $state(false);
  let loadError = $state('');
  let filter = $state<PaletteKind | 'all'>('all');
  /** Local edits: a renamed palette, or null once deleted. */
  let edits = $state<Record<string, SavedPalette | null>>({});

  const allPalettes = $derived(
    [...data.palettes, ...extraPalettes]
      .map((palette) => (palette.slug in edits ? edits[palette.slug] : palette))
      .filter((palette): palette is SavedPalette => palette !== null)
  );
  const hasMore = $derived(clientHasMore ?? data.hasMore);
  const visible = $derived(
    filter === 'all' ? allPalettes : allPalettes.filter((palette) => palette.harmony === filter)
  );
  const presentHarmonies = $derived(
    PALETTE_KINDS.filter((harmony) => allPalettes.some((palette) => palette.harmony === harmony))
  );

  async function loadMore() {
    loadingMore = true;
    loadError = '';

    try {
      // Deleted palettes no longer occupy a row, so the next page starts that much earlier.
      const deleted = Object.values(edits).filter((edit) => edit === null).length;
      const offset = data.palettes.length + extraPalettes.length - deleted;
      const response = await fetch(`/api/palettes?limit=${data.pageSize}&offset=${offset}`);
      const body = (await response.json()) as {
        palettes?: SavedPalette[];
        pagination?: { hasMore?: boolean };
        error?: { message?: string };
      };

      if (!response.ok || !body.palettes) {
        throw new Error(body.error?.message ?? 'Unable to load more palettes.');
      }

      const known = new Set([...data.palettes, ...extraPalettes].map((palette) => palette.slug));
      extraPalettes = [...extraPalettes, ...body.palettes.filter((palette) => !known.has(palette.slug))];
      clientHasMore = Boolean(body.pagination?.hasMore);
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Unable to load more palettes.';
    } finally {
      loadingMore = false;
    }
  }
</script>

<svelte:head>
  <title>Gallery · Palette Studio</title>
  <meta name="description" content="Browse saved color palettes and open them in the studio." />
</svelte:head>

<main class="mx-auto max-w-[90rem] space-y-8 px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
  <div class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
    <div class="max-w-2xl">
      <h1 class="font-display text-4xl leading-[0.98] font-semibold sm:text-6xl">Gallery</h1>
      <p class="text-muted-foreground mt-3 text-[0.9375rem] leading-relaxed">
        Palettes people have saved and shared. Open one in the studio or freeform to remix it;
        saving your version creates a new link.
      </p>
    </div>
    <a
      href="/"
      class="bg-primary text-primary-foreground hover:bg-primary/85 inline-flex h-10 items-center gap-2 self-start rounded-xl px-4 text-sm font-medium shadow-[inset_0_1px_0_oklch(1_0_0/0.15),0_1px_2px_oklch(0_0_0/0.2)] transition-colors md:self-auto"
    >
      <Plus class="size-4" aria-hidden="true" />
      New palette
    </a>
  </div>

  {#if allPalettes.length === 0}
    <div class="panel flex flex-col items-center px-6 py-16 text-center">
      <div class="flex gap-2" aria-hidden="true">
        {#each ['#e8a33d', '#2f6f73', '#c2456b', '#3d4f9c'] as hex, index}
          <span
            class="h-20 w-12 rounded-xl shadow-md"
            style="background: {hex}; transform: rotate({(index - 1.5) * 7}deg) translateY({Math.abs(index - 1.5) * 6}px)"
          ></span>
        {/each}
      </div>
      <p class="font-display mt-8 text-2xl font-semibold">Nothing saved yet</p>
      <p class="text-muted-foreground mt-2 max-w-sm text-sm">
        Build a palette in the studio and choose Save to give it a share link. It will show up
        here.
      </p>
      <a
        href="/"
        class="bg-primary text-primary-foreground hover:bg-primary/85 mt-6 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors"
      >
        <Plus class="size-4" aria-hidden="true" />
        Create a palette
      </a>
    </div>
  {:else}
    {#if presentHarmonies.length > 1}
      <div class="-mx-1 overflow-x-auto px-1 pb-1">
        <div class="segmented" role="group" aria-label="Filter by harmony">
          <button type="button" aria-pressed={filter === 'all'} onclick={() => (filter = 'all')}>
            All
            <span class="tabular text-muted-foreground text-xs">{allPalettes.length}</span>
          </button>
          {#each presentHarmonies as harmony (harmony)}
            <button type="button" aria-pressed={filter === harmony} onclick={() => (filter = harmony)}>
              <HarmonyGlyph {harmony} class="size-4" />
              {getHarmonyName(harmony)}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <section aria-labelledby="gallery-heading">
      <h2 id="gallery-heading" class="sr-only">Saved palettes</h2>
      <ul class="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {#each visible as palette (palette.slug)}
          <li>
            <PaletteCard
              {palette}
              dateLabel={palette.createdAt.slice(0, 10)}
              onRenamed={(renamed) => (edits = { ...edits, [palette.slug]: renamed })}
              onDeleted={() => (edits = { ...edits, [palette.slug]: null })}
            />
          </li>
        {/each}
      </ul>
      {#if visible.length === 0}
        <p class="text-muted-foreground py-10 text-center text-sm">
          No {getHarmonyName(filter as PaletteKind).toLowerCase()} palettes loaded yet.
        </p>
      {/if}
    </section>

    {#if hasMore}
      <div class="flex justify-center">
        <button
          type="button"
          class="bg-card hover:bg-muted inline-flex h-10 items-center gap-2 rounded-xl border px-5 text-sm font-medium shadow-[inset_0_1px_0_var(--panel-edge)] transition-colors disabled:opacity-60"
          onclick={loadMore}
          disabled={loadingMore}
        >
          {#if loadingMore}
            <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
            Loading…
          {:else}
            Load more
          {/if}
        </button>
      </div>
    {/if}

    {#if loadError}
      <p class="text-destructive text-center text-sm" role="alert">{loadError}</p>
    {/if}
  {/if}
</main>
