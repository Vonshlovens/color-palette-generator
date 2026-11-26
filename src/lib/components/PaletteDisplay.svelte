<script lang="ts">
  import { getPaletteStoreContext } from '$lib/stores/palette.svelte';
  import { FreeformStore } from '$lib/stores/freeform.svelte';
  import { MAX_PALETTE_COLORS } from '$lib/types';
  import { getHarmonyLayoutClass, getHarmonyName, getSwatchLabel } from '$lib/color/harmonies';
  import * as Dialog from '$lib/components/ui/dialog';
  import ColorSwatch from './ColorSwatch.svelte';
  import CopyButton from './CopyButton.svelte';
  import ExportPanel from './ExportPanel.svelte';
  import SavePalette from './SavePalette.svelte';
  import Check from '@lucide/svelte/icons/check';
  import CodeXml from '@lucide/svelte/icons/code-xml';
  import Copy from '@lucide/svelte/icons/copy';
  import Plus from '@lucide/svelte/icons/plus';

  const paletteStore = getPaletteStoreContext();
  const freeform = paletteStore instanceof FreeformStore ? paletteStore : null;
  const layoutClass = $derived(getHarmonyLayoutClass(paletteStore.harmony, paletteStore.colors.length));
  const exportName = $derived(`${getHarmonyName(paletteStore.harmony)} palette`);

  function nudge(index: number, delta: number) {
    paletteStore.selectColor(index);
    paletteStore.setSelectedLightness(paletteStore.selectedColor.hsl.l + delta);
  }

  const action =
    'inline-flex h-9 items-center gap-1.5 rounded-xl border bg-card px-3 text-sm font-medium shadow-[inset_0_1px_0_var(--panel-edge),0_1px_2px_oklch(0_0_0/0.08)] transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring';
</script>

<section aria-labelledby="palette-heading" class="space-y-4">
  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 id="palette-heading" class="font-display text-2xl font-semibold">
        {getHarmonyName(paletteStore.harmony)}
      </h2>
      <p class="text-muted-foreground mt-0.5 text-sm">
        {#if freeform}
          {paletteStore.colors.length} of {MAX_PALETTE_COLORS} colors. Select one to edit it; lock the
          ones you want to keep.
        {:else}
          Select a swatch to edit it. Lock the ones you want to keep.
        {/if}
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      {#if freeform}
        <button
          type="button"
          class={action + ' disabled:pointer-events-none disabled:opacity-45'}
          onclick={() => freeform.addColor()}
          disabled={!freeform.canAdd}
          title={freeform.canAdd ? 'Add a random color' : `Palettes hold up to ${MAX_PALETTE_COLORS} colors`}
        >
          <Plus class="size-4" aria-hidden="true" /> Add color
        </button>
      {/if}
      <SavePalette />
      <CopyButton
        value={paletteStore.colors.map((color) => color.hex).join('\n')}
        label="all HEX values"
        class={action}
      >
        {#snippet children(copied)}
          {#if copied}
            <Check class="size-4" aria-hidden="true" /> Copied
          {:else}
            <Copy class="size-4" aria-hidden="true" /> Copy HEX
          {/if}
        {/snippet}
      </CopyButton>
      <Dialog.Root>
        <Dialog.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              type="button"
              class="bg-primary text-primary-foreground hover:bg-primary/85 inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-sm font-medium shadow-[inset_0_1px_0_oklch(1_0_0/0.15),0_1px_2px_oklch(0_0_0/0.2)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <CodeXml class="size-4" aria-hidden="true" />
              Export
            </button>
          {/snippet}
        </Dialog.Trigger>
        <Dialog.Content class="gap-5 rounded-3xl sm:max-w-3xl">
          <Dialog.Header>
            <Dialog.Title class="font-display text-xl">Export {exportName}</Dialog.Title>
            <Dialog.Description>
              Every format carries HEX for compatibility and OKLCH for modern CSS.
            </Dialog.Description>
          </Dialog.Header>
          <ExportPanel colors={paletteStore.colors} harmony={paletteStore.harmony} name={exportName} />
        </Dialog.Content>
      </Dialog.Root>
    </div>
  </div>

  <div class={layoutClass}>
    {#each paletteStore.colors as color, index (index)}
      <ColorSwatch
        {color}
        {index}
        label={getSwatchLabel(paletteStore.harmony, index)}
        locked={paletteStore.isLocked(index)}
        selected={paletteStore.selectedIndex === index}
        onSelect={(i) => paletteStore.selectColor(i)}
        onToggleLock={(i) => paletteStore.toggleLock(i)}
        onNudge={nudge}
        onRemove={freeform?.canRemove ? (i) => freeform.removeColor(i) : undefined}
      />
    {/each}
  </div>

  {#if paletteStore.lockedCount > 0}
    <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
      <p class="text-muted-foreground">
        {paletteStore.lockedCount} locked. Locked swatches ignore shuffles{freeform ? '' : ' and harmony edits'}.
      </p>
      <button
        type="button"
        class="text-muted-foreground hover:text-foreground rounded-md px-2 py-1 font-medium underline-offset-4 hover:underline"
        onclick={() => paletteStore.clearLocks()}
      >
        Unlock all
      </button>
    </div>
  {/if}
</section>
