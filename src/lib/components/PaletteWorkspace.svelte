<script lang="ts">
  import { getPaletteStoreContext, setPaletteStoreContext } from '$lib/stores/palette.svelte';
  import type { PaletteSnapshot } from '$lib/types';
  import ColorPicker from './ColorPicker.svelte';
  import HarmonySelector from './HarmonySelector.svelte';
  import PaletteAnalysis from './PaletteAnalysis.svelte';
  import PaletteDisplay from './PaletteDisplay.svelte';
  import PresetStrip from './PresetStrip.svelte';
  import PreviewDeck from './PreviewDeck.svelte';

  interface Props {
    initialSnapshot?: PaletteSnapshot;
    /** Saved palette name, used for exports. */
    name?: string;
    /** Show the curated preset strip (the blank studio does; shared palettes don't). */
    showPresets?: boolean;
  }

  let { initialSnapshot, name, showPresets = true }: Props = $props();

  function initializePaletteStore(): void {
    setPaletteStoreContext(initialSnapshot);
  }

  initializePaletteStore();
  const paletteStore = getPaletteStoreContext();

  // Tint the page chrome with the live palette. The body transitions these registered
  // properties, so the ambient wash glides between palettes.
  $effect(() => {
    const colors = paletteStore.colors;
    const style = document.body.style;
    style.setProperty('--studio-accent', paletteStore.selectedColor.hex);
    style.setProperty('--ambient-a', colors[0].hex);
    style.setProperty('--ambient-b', colors[colors.length - 1].hex);
  });

  $effect(() => () => {
    for (const property of ['--studio-accent', '--ambient-a', '--ambient-b']) {
      document.body.style.removeProperty(property);
    }
  });

  function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return (
      target.isContentEditable ||
      target.closest('input, textarea, select, [role="dialog"]') !== null
    );
  }

  /**
   * The element that last received focus from the keyboard. Chrome marks any focused element
   * :focus-visible once a key is pressed, so modality has to be read when focus arrives.
   */
  let keyboardFocus: HTMLElement | null = null;

  function handleFocusIn(event: FocusEvent) {
    const target = event.target;
    keyboardFocus = target instanceof HTMLElement && target.matches(':focus-visible') ? target : null;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || isTypingTarget(event.target)) return;
    const mod = event.metaKey || event.ctrlKey;

    if (mod && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) paletteStore.redo();
      else paletteStore.undo();
      return;
    }
    if (mod && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      paletteStore.redo();
      return;
    }
    if (mod || event.altKey) return;

    // Space shuffles, except on a control reached by keyboard, which Space should press.
    // A control focused by a mouse click still lets Space shuffle.
    const keyboardFocused =
      event.target === keyboardFocus &&
      keyboardFocus?.closest('button, a, [role="radio"], [role="tab"]') != null;
    if (event.code === 'Space' && !keyboardFocused) {
      event.preventDefault();
      paletteStore.randomize();
      return;
    }
    if (event.key.toLowerCase() === 'l') {
      paletteStore.toggleLock(paletteStore.selectedIndex);
      return;
    }
    const digit = Number(event.key);
    if (Number.isInteger(digit) && digit >= 1 && digit <= paletteStore.colors.length) {
      paletteStore.selectColor(digit - 1);
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} onfocusin={handleFocusIn} />

<section
  class="grid items-start gap-6 lg:grid-cols-[21rem_minmax(0,1fr)] xl:gap-8"
  aria-label="Palette editor"
>
  <div class="space-y-5 lg:sticky lg:top-20">
    <ColorPicker />
    <HarmonySelector />
  </div>

  <div class="min-w-0 space-y-8">
    <PaletteDisplay {name} />
    {#if showPresets}
      <PresetStrip />
    {/if}
    <PaletteAnalysis />
    <PreviewDeck />
  </div>
</section>
