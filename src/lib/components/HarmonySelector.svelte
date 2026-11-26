<script lang="ts">
  import { HARMONY_TYPES } from '$lib/types';
  import { getPaletteStoreContext } from '$lib/stores/palette.svelte';
  import { getHarmonyDescription, getHarmonyName, HARMONY_COLOR_COUNTS } from '$lib/color/harmonies';
  import HarmonyGlyph from './HarmonyGlyph.svelte';

  const paletteStore = getPaletteStoreContext();
  const swatchHexes = $derived(paletteStore.colors.map((color) => color.hex));

  function handleKeyboard(event: KeyboardEvent) {
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) return;

    event.preventDefault();
    const currentIndex = HARMONY_TYPES.indexOf(paletteStore.harmony);
    const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + direction + HARMONY_TYPES.length) % HARMONY_TYPES.length;
    paletteStore.setHarmony(HARMONY_TYPES[nextIndex]);

    const options = (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="radio"]');
    options[nextIndex]?.focus();
  }
</script>

<section class="panel p-5" aria-labelledby="harmony-heading">
  <div class="mb-4 flex items-baseline justify-between gap-3">
    <h2 id="harmony-heading" class="font-display text-lg font-semibold">Harmony</h2>
    <p class="text-muted-foreground text-xs">Colors</p>
  </div>

  <div
    class="grid gap-1"
    role="radiogroup"
    aria-label="Color harmony"
    tabindex="-1"
    onkeydown={handleKeyboard}
  >
    {#each HARMONY_TYPES as harmony (harmony)}
      {@const active = paletteStore.harmony === harmony}
      <button
        type="button"
        role="radio"
        aria-checked={active}
        tabindex={active ? 0 : -1}
        title={getHarmonyDescription(harmony)}
        onclick={() => paletteStore.setHarmony(harmony)}
        class="group flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 text-left text-sm transition-[background-color,border-color,box-shadow] outline-none focus-visible:ring-2 focus-visible:ring-ring {active
          ? 'bg-card border-foreground/15 font-medium shadow-[inset_0_1px_0_var(--panel-edge),0_1px_3px_oklch(0_0_0/0.12)]'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 border-transparent'}"
      >
        <HarmonyGlyph
          {harmony}
          colors={active ? swatchHexes : undefined}
          class="size-6 shrink-0 transition-transform duration-300 group-hover:rotate-12"
        />
        <span class="min-w-0 flex-1 truncate">{getHarmonyName(harmony)}</span>
        <span class="tabular text-muted-foreground text-xs font-normal">{HARMONY_COLOR_COUNTS[harmony]}</span>
      </button>
    {/each}
  </div>

  <p class="text-muted-foreground mt-4 border-t pt-3 text-xs leading-relaxed" aria-live="polite">
    <span class="text-foreground font-medium">{getHarmonyName(paletteStore.harmony)}.</span>
    {getHarmonyDescription(paletteStore.harmony)}.
  </p>
</section>
