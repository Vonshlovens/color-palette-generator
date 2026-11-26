<script lang="ts">
  import { getPaletteStoreContext } from '$lib/stores/palette.svelte';
  import { getContrastRatio, getWcagLevel, type WcagLevel } from '$lib/color/conversions';
  import { getSwatchLabel } from '$lib/color/harmonies';
  import type { RGB } from '$lib/types';

  type Threshold = 'all' | 'AA' | 'AAA';

  const paletteStore = getPaletteStoreContext();
  let threshold = $state<Threshold>('AA');

  const entries = $derived([
    ...paletteStore.colors.map((color, index) => ({
      key: `c${index}`,
      name: getSwatchLabel(paletteStore.harmony, index),
      hex: color.hex,
      rgb: color.rgb
    })),
    { key: 'white', name: 'White', hex: '#ffffff', rgb: { r: 255, g: 255, b: 255 } as RGB },
    { key: 'black', name: 'Ink', hex: '#111111', rgb: { r: 17, g: 17, b: 17 } as RGB }
  ]);

  const passes = (level: WcagLevel) =>
    threshold === 'all' ||
    (threshold === 'AA' && (level === 'AA' || level === 'AAA')) ||
    (threshold === 'AAA' && level === 'AAA');

  const summary = $derived.by(() => {
    let total = 0;
    let passing = 0;
    for (const fg of entries) {
      for (const bg of entries) {
        if (fg.key === bg.key) continue;
        total++;
        if (getContrastRatio(fg.rgb, bg.rgb) >= 4.5) passing++;
      }
    }
    // Pairs are symmetric, so report unique combinations.
    return { total: total / 2, passing: passing / 2 };
  });

  const levelStyle: Record<WcagLevel, string> = {
    AAA: 'bg-emerald-500/90 text-white',
    AA: 'bg-emerald-500/75 text-white',
    'AA Large': 'bg-amber-400/90 text-black',
    Fail: 'bg-black/45 text-white'
  };
</script>

<div class="space-y-4">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <p class="text-muted-foreground max-w-prose text-sm">
      <span class="text-foreground font-medium">{summary.passing} of {summary.total}</span> pairs
      reach AA (4.5:1) for body text. Rows are text, columns are backgrounds.
    </p>
    <div class="segmented" role="group" aria-label="Highlight pairs that pass">
      {#each [['all', 'All'], ['AA', 'AA+'], ['AAA', 'AAA']] as [value, text] (value)}
        <button type="button" aria-pressed={threshold === value} onclick={() => (threshold = value as Threshold)}>
          {text}
        </button>
      {/each}
    </div>
  </div>

  <div class="-mx-1 overflow-x-auto px-1 pb-1">
    <table class="w-full min-w-[34rem] border-separate border-spacing-1 text-xs">
      <thead>
        <tr>
          <th scope="col" class="text-muted-foreground w-24 text-left font-normal">
            <span class="sr-only">Text color</span>
          </th>
          {#each entries as bg (bg.key)}
            <th scope="col" class="px-1 pb-1 text-left font-medium">
              <span class="flex items-center gap-1.5">
                <span class="size-2.5 shrink-0 rounded-full border" style="background: {bg.hex}"></span>
                <span class="truncate">{bg.name}</span>
              </span>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each entries as fg (fg.key)}
          <tr>
            <th scope="row" class="pr-2 text-left font-medium">
              <span class="flex items-center gap-1.5">
                <span class="size-2.5 shrink-0 rounded-full border" style="background: {fg.hex}"></span>
                <span class="truncate">{fg.name}</span>
              </span>
            </th>
            {#each entries as bg (bg.key)}
              {#if fg.key === bg.key}
                <td class="well rounded-lg text-center opacity-50" aria-label="Same color">
                  <span aria-hidden="true">·</span>
                </td>
              {:else}
                {@const ratio = getContrastRatio(fg.rgb, bg.rgb)}
                {@const level = getWcagLevel(ratio)}
                <td
                  class="h-14 rounded-lg px-2 py-1.5 align-top transition-opacity duration-200 {passes(level)
                    ? ''
                    : 'opacity-20'}"
                  style="background: {bg.hex}; color: {fg.hex}; box-shadow: inset 0 0 0 1px oklch(0 0 0 / 0.07)"
                  aria-label="{fg.name} on {bg.name}: {ratio.toFixed(2)} to 1, {level}"
                >
                  <span class="flex items-start justify-between gap-1">
                    <span class="font-display text-base leading-none font-semibold">Aa</span>
                    <span class="rounded px-1 py-px text-[9px] font-semibold {levelStyle[level]}">
                      {level === 'AA Large' ? 'AA18' : level}
                    </span>
                  </span>
                  <span class="tabular mt-1.5 block font-mono text-[11px]">{ratio.toFixed(2)}</span>
                </td>
              {/if}
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <p class="text-muted-foreground text-xs">
    AAA ≥ 7:1 · AA ≥ 4.5:1 · AA18 ≥ 3:1, for text 18pt and up, bold text 14pt and up, and UI
    components.
  </p>
</div>
