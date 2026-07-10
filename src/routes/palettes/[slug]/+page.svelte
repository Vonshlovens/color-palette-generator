<script lang="ts">
  import { PaletteWorkspace, ThemeControl } from '$lib/components';
  import { Badge } from '$lib/components/ui/badge';
  import Palette from '@lucide/svelte/icons/palette';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{data.palette.name} · Palette Studio</title>
  <meta name="description" content="Explore the saved {data.palette.name} color palette." />
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

  <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
    <div class="mb-8 max-w-2xl">
      <Badge variant="outline" class="mb-3">Saved palette</Badge>
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">{data.palette.name}</h1>
      <p class="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-base">
        This immutable snapshot can be adjusted in your browser and saved as a new share link.
      </p>
    </div>

    {#key data.palette.slug}
      <PaletteWorkspace initialSnapshot={data.palette} />
    {/key}
  </main>

  <footer class="text-muted-foreground border-t px-4 py-6 text-center text-xs">
    Saved <time datetime={data.palette.createdAt}>{data.palette.createdAt.slice(0, 10)} UTC</time> ·
    Select any swatch to copy its HEX value.
  </footer>
</div>
