<script lang="ts">
  import { getPaletteStoreContext } from '$lib/stores/palette.svelte';
  import { FreeformStore } from '$lib/stores/freeform.svelte';
  import { MAX_PALETTE_COLORS } from '$lib/types';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';

  const store = getPaletteStoreContext();
  if (!(store instanceof FreeformStore)) throw new Error('FreeformControls needs the freeform store');
  const freeform = store;

  const slots = Array.from({ length: MAX_PALETTE_COLORS }, (_, index) => index);
</script>

<section class="panel p-5" aria-labelledby="freeform-heading">
  <div class="mb-4 flex items-baseline justify-between gap-3">
    <h2 id="freeform-heading" class="font-display text-lg font-semibold">Swatches</h2>
    <p class="text-muted-foreground text-xs">1 to {MAX_PALETTE_COLORS}</p>
  </div>

  <div class="flex items-center gap-3">
    <div class="segmented" role="group" aria-label="Number of colors">
      <button
        type="button"
        class="size-8 !px-0"
        onclick={() => freeform.removeColor(freeform.selectedIndex)}
        disabled={!freeform.canRemove}
        aria-label="Remove the selected color"
        title="Remove the selected color"
      >
        <Minus class="size-4" aria-hidden="true" />
      </button>
      <output
        class="tabular grid h-8 min-w-10 place-items-center font-mono text-sm font-semibold"
        aria-live="polite"
        aria-label="{freeform.colors.length} colors"
      >
        {freeform.colors.length}
      </output>
      <button
        type="button"
        class="size-8 !px-0"
        onclick={() => freeform.addColor()}
        disabled={!freeform.canAdd}
        aria-label="Add a color"
        title="Add a color"
      >
        <Plus class="size-4" aria-hidden="true" />
      </button>
    </div>

    <!-- Seven slots: filled ones show their color, so the count reads at a glance. -->
    <ol class="flex flex-1 items-center justify-end gap-1.5" aria-hidden="true">
      {#each slots as slot (slot)}
        {@const color = freeform.colors[slot]}
        <li
          class="size-3.5 rounded-full transition-[background-color,box-shadow,transform] duration-300 {color
            ? 'shadow-[inset_0_0_0_1px_oklch(0_0_0/0.15)]'
            : 'well scale-75'} {slot === freeform.selectedIndex ? 'ring-foreground/60 ring-2 ring-offset-2 ring-offset-card' : ''}"
          style={color ? `background: ${color.hex}` : undefined}
        ></li>
      {/each}
    </ol>
  </div>

  <p class="text-muted-foreground mt-4 border-t pt-3 text-xs leading-relaxed">
    <span class="text-foreground font-medium">No harmony rule.</span>
    Shuffle gives every unlocked swatch a completely random color. Lock the ones you like and keep
    shuffling.
  </p>
</section>
