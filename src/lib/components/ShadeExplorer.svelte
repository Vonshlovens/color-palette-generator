<script lang="ts">
  import { getPaletteStoreContext } from '$lib/stores/palette.svelte';
  import { getContrastTextColor } from '$lib/color/conversions';
  import { getSwatchLabel, getSwatchTokenName } from '$lib/color/harmonies';
  import { formatOklch } from '$lib/color/oklch';
  import { generateShadeScale, nearestStop } from '$lib/color/scales';
  import CopyButton from './CopyButton.svelte';

  const paletteStore = getPaletteStoreContext();

  const rows = $derived(
    paletteStore.colors.map((color, index) => ({
      index,
      color,
      label: getSwatchLabel(paletteStore.harmony, index),
      token: getSwatchTokenName(paletteStore.harmony, index),
      here: nearestStop(color),
      shades: generateShadeScale(color)
    }))
  );
</script>

<div class="space-y-5">
  <p class="text-muted-foreground max-w-prose text-sm">
    Each swatch expanded to an 11-step OKLCH ramp with matched lightness across hues, so
    <span class="font-mono text-xs">primary-600</span> and
    <span class="font-mono text-xs">secondary-600</span> carry equal visual weight. The dot marks
    the step closest to your swatch. Select any step to copy it.
  </p>

  {#each rows as row (row.index)}
    <div class="space-y-2">
      <div class="flex items-baseline justify-between gap-3 text-sm">
        <span class="flex items-center gap-2 font-medium">
          <span class="size-3 rounded-full" style="background: {row.color.hex}" aria-hidden="true"></span>
          {row.label}
        </span>
        <span class="text-muted-foreground font-mono text-xs">--color-{row.token}-*</span>
      </div>
      <ol class="grid grid-cols-11 overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_oklch(0_0_0/0.06)]">
        {#each row.shades as shade (shade.stop)}
          {@const ink = getContrastTextColor(shade.color.rgb) === 'dark' ? '#000000b3' : '#ffffffcc'}
          <li class="min-w-0">
            <CopyButton
              value={shade.color.hex}
              label="{row.token}-{shade.stop} {shade.color.hex}"
              class="group/shade relative flex h-16 w-full flex-col items-center justify-end pb-1.5 outline-none transition-transform duration-150 hover:z-10 hover:scale-y-110 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring sm:h-[4.5rem]"
              style="background: {shade.color.hex}; color: {ink}"
            >
              {#snippet children(copied)}
                {#if shade.stop === row.here}
                  <span class="absolute top-1.5 size-1.5 rounded-full bg-current" aria-hidden="true"></span>
                {/if}
                <span class="tabular font-mono text-[10px] font-medium">{copied ? '✓' : shade.stop}</span>
                <span class="sr-only">{formatOklch(shade.color.rgb)}</span>
              {/snippet}
            </CopyButton>
          </li>
        {/each}
      </ol>
    </div>
  {/each}
</div>
