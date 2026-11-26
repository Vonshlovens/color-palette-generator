<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import ExportPanel from '$lib/components/ExportPanel.svelte';
  import HarmonyGlyph from '$lib/components/HarmonyGlyph.svelte';
  import PaletteManageControls from '$lib/components/PaletteManageControls.svelte';
  import { createColor, getContrastTextColor } from '$lib/color/conversions';
  import { getHarmonyLayoutClass, getHarmonyName, getSwatchLabel } from '$lib/color/harmonies';
  import { formatOklch } from '$lib/color/oklch';
  import { getStudioStoresContext } from '$lib/stores/palette.svelte';
  import type { SavedPalette } from '$lib/types';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Check from '@lucide/svelte/icons/check';
  import Link2 from '@lucide/svelte/icons/link-2';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const stores = getStudioStoresContext();
  /** A rename made on this page; the server data is stale until the next navigation. */
  let renamed = $state<SavedPalette | null>(null);
  let openError = $state('');

  const palette = $derived(renamed?.slug === data.palette.slug ? renamed : data.palette);
  const colors = $derived(palette.colors.map(createColor));
  const isFreeform = $derived(palette.harmony === 'freeform');
  const savedOn = $derived(
    new Date(palette.createdAt).toLocaleDateString('en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    })
  );

  /** Load these exact swatches into the studio (or freeform) as an undoable step. */
  function openInWorkspace() {
    const loaded =
      palette.harmony === 'freeform'
        ? stores.freeform.load({ harmony: 'freeform', colors: palette.colors })
        : stores.studio.load({
            hue: palette.hue,
            saturation: palette.saturation,
            lightness: palette.lightness,
            harmony: palette.harmony,
            colors: palette.colors
          });
    if (!loaded) {
      openError = 'This palette could not be opened.';
      return;
    }
    goto(palette.harmony === 'freeform' ? '/freeform' : '/');
  }
</script>

<svelte:head>
  <title>{palette.name} · Palette Studio</title>
  <meta
    name="description"
    content="{palette.name}: a {getHarmonyName(palette.harmony).toLowerCase()} palette ({colors
      .map((color) => color.hex)
      .join(', ')})."
  />
  <meta property="og:title" content="{palette.name} · Palette Studio" />
  <meta name="theme-color" content={colors[0].hex} />
</svelte:head>

<main class="mx-auto max-w-[90rem] px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
  <div class="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
    <div class="min-w-0">
      <a href="/palettes" class="text-muted-foreground hover:text-foreground text-sm font-medium">
        Gallery
      </a>
      <h1 class="font-display mt-2 text-4xl leading-[0.98] font-semibold text-balance break-words sm:text-6xl">
        {palette.name}
      </h1>
      <p class="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span class="flex items-center gap-1.5">
          <HarmonyGlyph harmony={palette.harmony} colors={colors.map((c) => c.hex)} class="size-5" />
          {getHarmonyName(palette.harmony)}
        </span>
        <span aria-hidden="true">/</span>
        <span>{colors.length} {colors.length === 1 ? 'color' : 'colors'}</span>
        <span aria-hidden="true">/</span>
        <span>Saved <time datetime={palette.createdAt}>{savedOn}</time></span>
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      {#if palette.canManage}
        <PaletteManageControls
          slug={palette.slug}
          name={palette.name}
          onRenamed={(next) => (renamed = next)}
          onDeleted={() => goto('/palettes', { invalidateAll: true })}
        />
      {/if}
      <CopyButton
        value={page.url.href}
        label="share link"
        class="bg-card hover:bg-muted inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium shadow-[inset_0_1px_0_var(--panel-edge),0_1px_2px_oklch(0_0_0/0.08)] transition-colors"
      >
        {#snippet children(copied)}
          {#if copied}
            <Check class="size-4" aria-hidden="true" /> Link copied
          {:else}
            <Link2 class="size-4" aria-hidden="true" /> Copy share link
          {/if}
        {/snippet}
      </CopyButton>
      <button
        type="button"
        class="bg-primary text-primary-foreground hover:bg-primary/85 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium shadow-[inset_0_1px_0_oklch(1_0_0/0.15),0_1px_2px_oklch(0_0_0/0.2)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onclick={openInWorkspace}
      >
        Open in {isFreeform ? 'Freeform' : 'Studio'}
        <ArrowRight class="size-4" aria-hidden="true" />
      </button>
    </div>
  </div>

  {#if openError}
    <p class="text-destructive mb-4 text-sm" role="alert">{openError}</p>
  {/if}

  <section aria-label="Saved colors" class={getHarmonyLayoutClass(palette.harmony, colors.length)}>
    {#each colors as color, index (index)}
      {@const ink = getContrastTextColor(color.rgb) === 'dark' ? 'oklch(0.18 0.01 264)' : '#ffffff'}
      <article
        class="group @container relative flex min-h-52 min-w-0 flex-col justify-between overflow-hidden rounded-[1.375rem] p-3.5 sm:min-h-64"
        style="background-color: {color.hex}; color: {ink}; box-shadow: inset 0 0 0 1px oklch(0 0 0 / 0.08), inset 0 1px 0 oklch(1 0 0 / 0.22), 0 8px 20px -14px color-mix(in oklab, {color.hex} 70%, black);"
        aria-label="{getSwatchLabel(palette.harmony, index)}, {color.hex}"
      >
        <div class="flex items-start justify-between gap-2">
          <span class="truncate pt-1.5 pl-1 text-xs font-medium">{getSwatchLabel(palette.harmony, index)}</span>
          <CopyButton
            value={color.hex}
            label="{getSwatchLabel(palette.harmony, index)} {color.hex}"
            class="grid size-8 place-items-center rounded-lg opacity-70 transition-opacity outline-none hover:bg-current/15 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current"
          />
        </div>
        <div class="pl-1">
          <p class="tabular font-mono text-[0.8rem] leading-none font-semibold tracking-tight uppercase @[9rem]:text-lg @[13rem]:text-xl">
            {color.hex}
          </p>
          <p class="tabular mt-1.5 hidden truncate font-mono text-[11px] opacity-75 @[9rem]:block">
            {formatOklch(color.rgb)}
          </p>
        </div>
      </article>
    {/each}
  </section>

  <p class="text-muted-foreground mt-5 max-w-2xl text-sm">
    Saved colors never change. Open the palette in {isFreeform ? 'Freeform' : 'the Studio'} to edit,
    inspect, and preview it; saving your version there creates a new link.
  </p>

  <section class="panel mt-10 p-5 sm:p-6" aria-labelledby="export-heading">
    <h2 id="export-heading" class="font-display mb-4 text-xl font-semibold">Export</h2>
    <ExportPanel {colors} harmony={palette.harmony} name={palette.name} />
  </section>
</main>
