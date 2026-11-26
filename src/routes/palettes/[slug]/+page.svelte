<script lang="ts">
  import { page } from '$app/state';
  import { PaletteWorkspace } from '$lib/components';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import HarmonyGlyph from '$lib/components/HarmonyGlyph.svelte';
  import { generatePalette, getHarmonyName } from '$lib/color/harmonies';
  import Check from '@lucide/svelte/icons/check';
  import Link2 from '@lucide/svelte/icons/link-2';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const original = $derived(
    generatePalette(
      { h: data.palette.hue, s: data.palette.saturation, l: data.palette.lightness },
      data.palette.harmony
    )
  );
  const savedOn = $derived(
    new Date(data.palette.createdAt).toLocaleDateString('en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    })
  );
</script>

<svelte:head>
  <title>{data.palette.name} · Palette Studio</title>
  <meta
    name="description"
    content="{data.palette.name}: a {getHarmonyName(data.palette.harmony).toLowerCase()} palette ({original
      .map((color) => color.hex)
      .join(', ')})."
  />
  <meta property="og:title" content="{data.palette.name} · Palette Studio" />
  <meta name="theme-color" content={original[0].hex} />
</svelte:head>

<main class="mx-auto max-w-[90rem] px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
  <div class="mb-9 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
    <div class="min-w-0">
      <a href="/palettes" class="text-muted-foreground hover:text-foreground text-sm font-medium">
        Gallery
      </a>
      <h1 class="font-display mt-2 text-4xl leading-[0.98] font-semibold text-balance break-words sm:text-6xl">
        {data.palette.name}
      </h1>
      <p class="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span class="flex items-center gap-1.5">
          <HarmonyGlyph harmony={data.palette.harmony} colors={original.map((c) => c.hex)} class="size-5" />
          {getHarmonyName(data.palette.harmony)}
        </span>
        <span aria-hidden="true">/</span>
        <span>Saved <time datetime={data.palette.createdAt}>{savedOn}</time></span>
      </p>
    </div>

    <div class="flex shrink-0 items-center gap-3">
      <div class="flex h-10 overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_oklch(0_0_0/0.1)]" aria-label="Saved colors">
        {#each original as color, index (index)}
          <span class="w-8" style="background: {color.hex}" title={color.hex}></span>
        {/each}
      </div>
      <CopyButton
        value={page.url.href}
        label="share link"
        class="bg-primary text-primary-foreground hover:bg-primary/85 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium shadow-[inset_0_1px_0_oklch(1_0_0/0.15),0_1px_2px_oklch(0_0_0/0.2)] transition-colors"
      >
        {#snippet children(copied)}
          {#if copied}
            <Check class="size-4" aria-hidden="true" /> Link copied
          {:else}
            <Link2 class="size-4" aria-hidden="true" /> Copy share link
          {/if}
        {/snippet}
      </CopyButton>
    </div>
  </div>

  <p class="text-muted-foreground mb-6 max-w-2xl text-sm">
    Saved palettes never change. Edit freely here, then save to get a new link for your version.
  </p>

  {#key data.palette.slug}
    <PaletteWorkspace initialSnapshot={data.palette} name={data.palette.name} showPresets={false} />
  {/key}
</main>
