<script lang="ts">
  import { PaletteWorkspace, ThemeControl } from '$lib/components';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import LayoutGrid from '@lucide/svelte/icons/layout-grid';
  import Palette from '@lucide/svelte/icons/palette';
</script>

<svelte:head>
  <title>Color Palette Generator</title>
  <meta
    name="description"
    content="Create accessible, harmonious color palettes using color theory."
  />
</svelte:head>

<div class="min-h-screen">
  <header class="border-b bg-background/90 sticky top-0 z-40 backdrop-blur">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-xl"
        >
          <Palette class="size-5" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold sm:text-base">Palette Studio</p>
          <p class="text-muted-foreground hidden text-xs sm:block">Color harmony workspace</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" href="/palettes">
          <LayoutGrid data-icon="inline-start" />
          Gallery
        </Button>
        <ThemeControl />
      </div>
    </div>
  </header>

  <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
    <div class="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div class="max-w-2xl">
        <Badge variant="outline" class="mb-3">HSL-powered</Badge>
        <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Build a balanced color system</h1>
        <p class="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-base">
          Choose a base color, explore proven harmony rules, and export a palette sized to the
          relationship you pick — including a 60-30-10 website preview.
        </p>
      </div>
      <p class="text-muted-foreground text-xs">All color calculations stay in your browser.</p>
    </div>

    <PaletteWorkspace />
  </main>

  <footer class="text-muted-foreground border-t px-4 py-6 text-center text-xs">
    Select a swatch to edit it, or use the copy control for its HEX value.
  </footer>
</div>
