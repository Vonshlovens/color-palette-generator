<script lang="ts">
  import { getPaletteStoreContext } from '$lib/stores/palette.svelte';
  import { rgbToHex } from '$lib/color/conversions';
  import { getSwatchLabel } from '$lib/color/harmonies';
  import { CVD_INFO, CVD_TYPES, findConfusablePairs, simulateCvd } from '$lib/color/vision';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

  const paletteStore = getPaletteStoreContext();

  const rows = $derived(
    CVD_TYPES.map((type) => {
      const rgbs = paletteStore.colors.map((color) => color.rgb);
      return {
        type,
        info: CVD_INFO[type],
        swatches: rgbs.map((rgb) => rgbToHex(simulateCvd(rgb, type))),
        conflicts: findConfusablePairs(rgbs, type).map(
          ([a, b]) =>
            `${getSwatchLabel(paletteStore.harmony, a)} and ${getSwatchLabel(paletteStore.harmony, b)}`
        )
      };
    })
  );
</script>

<div class="space-y-4">
  <p class="text-muted-foreground max-w-prose text-sm">
    How the palette reads with each color-vision deficiency, simulated with the Machado 2009
    model. Pairs that collapse together are flagged; lean on lightness differences or labels
    there. The previews below can be simulated too.
  </p>

  <div class="grid gap-3">
    <div class="grid items-center gap-3 sm:grid-cols-[9rem_1fr]">
      <div>
        <p class="text-sm font-medium">Typical vision</p>
        <p class="text-muted-foreground text-xs">Reference</p>
      </div>
      <div class="flex h-11 overflow-hidden rounded-xl">
        {#each paletteStore.colors as color, index (index)}
          <span class="flex-1" style="background: {color.hex}"></span>
        {/each}
      </div>
    </div>

    {#each rows as row (row.type)}
      <div class="grid items-center gap-3 sm:grid-cols-[9rem_1fr]">
        <div>
          <p class="text-sm font-medium">{row.info.name}</p>
          <p class="text-muted-foreground flex items-center gap-1 text-xs">
            {#if row.conflicts.length === 0}
              <CircleCheck class="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              All distinct
            {:else}
              <TriangleAlert class="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              {row.conflicts.length} close pair{row.conflicts.length === 1 ? '' : 's'}
            {/if}
          </p>
        </div>
        <div class="space-y-1.5">
          <div class="flex h-11 overflow-hidden rounded-xl" title={row.info.description}>
            {#each row.swatches as hex, index (index)}
              <span class="flex-1" style="background: {hex}"></span>
            {/each}
          </div>
          {#if row.conflicts.length > 0}
            <p class="text-muted-foreground text-xs">Hard to tell apart: {row.conflicts.join('; ')}.</p>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>
