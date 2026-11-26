<script lang="ts">
  import { getHarmonyStoreContext } from '$lib/stores/palette.svelte';
  import { generatePalette, getHarmonyName } from '$lib/color/harmonies';
  import { PALETTE_PRESETS } from '$lib/color/presets';

  const paletteStore = getHarmonyStoreContext();

  const presets = PALETTE_PRESETS.map((preset) => ({
    ...preset,
    hexes: generatePalette(
      { h: preset.hue, s: preset.saturation, l: preset.lightness },
      preset.harmony
    ).map((color) => color.hex)
  }));

  const activeId = $derived(
    presets.find(
      (preset) =>
        preset.hue === paletteStore.hue &&
        preset.saturation === paletteStore.saturation &&
        preset.lightness === paletteStore.lightness &&
        preset.harmony === paletteStore.harmony &&
        paletteStore.lockedCount === 0
    )?.id
  );
</script>

<section aria-labelledby="presets-heading">
  <div class="mb-3 flex items-baseline justify-between gap-3">
    <h2 id="presets-heading" class="font-display text-lg font-semibold">Start from a preset</h2>
    <p class="text-muted-foreground hidden text-xs sm:block">Loading one is undoable</p>
  </div>
  <ul class="-mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pt-1 pb-3 [scrollbar-width:thin]">
    {#each presets as preset (preset.id)}
      {@const active = activeId === preset.id}
      <li class="snap-start">
        <button
          type="button"
          onclick={() => paletteStore.load({ hue: preset.hue, saturation: preset.saturation, lightness: preset.lightness, harmony: preset.harmony })}
          aria-pressed={active}
          title={preset.note}
          class="panel group block w-40 overflow-hidden !rounded-2xl text-left transition-[transform,box-shadow] duration-200 outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring {active
            ? 'ring-foreground/70 ring-2'
            : ''}"
        >
          <span class="flex h-14" aria-hidden="true">
            {#each preset.hexes as hex, index}
              <span
                class="h-full grow-(--w) transition-[flex-grow] duration-300 ease-out group-hover:first:grow-[calc(var(--w)*1.8)]"
                style="--w: {preset.harmony === '60-30-10' ? [6, 3, 1][index] : 1}; background: {hex}"
              ></span>
            {/each}
          </span>
          <span class="block px-3 py-2.5">
            <span class="block truncate text-sm font-medium">{preset.name}</span>
            <span class="text-muted-foreground block truncate text-xs">
              {getHarmonyName(preset.harmony)}
            </span>
          </span>
        </button>
      </li>
    {/each}
  </ul>
</section>
