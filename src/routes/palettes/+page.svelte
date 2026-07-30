<script lang="ts">
  import { PaletteCard, ThemeControl } from '$lib/components';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import type { SavedPalette } from '$lib/types';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import Palette from '@lucide/svelte/icons/palette';
  import Plus from '@lucide/svelte/icons/plus';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  let extraPalettes = $state<SavedPalette[]>([]);
  /** null until the client paginates; the server-provided flag applies before that. */
  let clientHasMore = $state<boolean | null>(null);
  let loadingMore = $state(false);
  let loadError = $state('');

  const allPalettes = $derived([...data.palettes, ...extraPalettes]);
  const hasMore = $derived(clientHasMore ?? data.hasMore);

  async function loadMore() {
    loadingMore = true;
    loadError = '';

    try {
      const offset = data.palettes.length + extraPalettes.length;
      const response = await fetch(`/api/palettes?limit=${data.pageSize}&offset=${offset}`);
      const body = (await response.json()) as {
        palettes?: SavedPalette[];
        pagination?: { hasMore?: boolean };
        error?: { message?: string };
      };

      if (!response.ok || !body.palettes) {
        throw new Error(body.error?.message ?? 'Unable to load more palettes.');
      }

      extraPalettes = [...extraPalettes, ...body.palettes];
      clientHasMore = Boolean(body.pagination?.hasMore);
    } catch (error) {
      loadError = error instanceof Error ? error.message : 'Unable to load more palettes.';
    } finally {
      loadingMore = false;
    }
  }
</script>

<svelte:head>
  <title>Palette gallery · Palette Studio</title>
  <meta name="description" content="Browse saved color palettes and open them in the editor." />
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
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" href="/">
          <Plus data-icon="inline-start" />
          New palette
        </Button>
        <ThemeControl />
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
    <div class="max-w-2xl">
      <Badge variant="outline" class="mb-3">Gallery</Badge>
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Saved palettes</h1>
      <p class="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-base">
        Snapshots stored in the database (Turso or local SQLite). Open one to tweak its harmony and
        colors, then save your version as a new share link.
      </p>
    </div>

    <section aria-labelledby="gallery-heading" class="space-y-4">
      <h2 id="gallery-heading" class="sr-only">All saved palettes</h2>

      {#if allPalettes.length === 0}
        <div class="rounded-xl border border-dashed p-6 text-center">
          <p class="text-sm font-medium">No palettes saved yet</p>
          <p class="text-muted-foreground mt-1 text-sm">
            Be the first — build a palette in the generator and save it.
          </p>
          <Button class="mt-4" size="sm" href="/">
            <Plus data-icon="inline-start" />
            Create a palette
          </Button>
        </div>
      {:else}
        <ul class="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {#each allPalettes as palette (palette.slug)}
            <li>
              <PaletteCard
                slug={palette.slug}
                name={palette.name}
                hue={palette.hue}
                saturation={palette.saturation}
                lightness={palette.lightness}
                harmony={palette.harmony}
                dateLabel="Created {palette.createdAt.slice(0, 10)}"
              />
            </li>
          {/each}
        </ul>

        {#if hasMore}
          <div class="flex justify-center">
            <Button variant="outline" onclick={loadMore} disabled={loadingMore}>
              {#if loadingMore}
                <LoaderCircle class="animate-spin" data-icon="inline-start" />
                Loading…
              {:else}
                Load more
              {/if}
            </Button>
          </div>
        {/if}

        {#if loadError}
          <p class="text-destructive text-center text-sm" role="alert">{loadError}</p>
        {/if}
      {/if}
    </section>
  </main>

  <footer class="text-muted-foreground border-t px-4 py-6 text-center text-xs">
    Open any palette to edit it in your browser — saving always creates a new snapshot.
  </footer>
</div>
