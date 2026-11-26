<script lang="ts">
  import {
    PaletteStore,
    setPaletteStoreContext,
    tintPageWith,
    type StudioStore
  } from '$lib/stores/palette.svelte';
  import ColorPicker from './ColorPicker.svelte';
  import FreeformControls from './FreeformControls.svelte';
  import HarmonySelector from './HarmonySelector.svelte';
  import PaletteAnalysis from './PaletteAnalysis.svelte';
  import PaletteDisplay from './PaletteDisplay.svelte';
  import PresetStrip from './PresetStrip.svelte';
  import PreviewDeck from './PreviewDeck.svelte';

  interface Props {
    /** The harmony studio or freeform store; it outlives this component. */
    store: StudioStore;
  }

  let { store }: Props = $props();

  // The store is fixed for the life of the workspace; pages key the workspace to swap it.
  // svelte-ignore state_referenced_locally
  const paletteStore = store;
  setPaletteStoreContext(paletteStore);
  tintPageWith(paletteStore);
  const isHarmony = paletteStore instanceof PaletteStore;

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
    {#if isHarmony}
      <HarmonySelector />
    {:else}
      <FreeformControls />
    {/if}
  </div>

  <div class="min-w-0 space-y-8">
    <PaletteDisplay />
    {#if isHarmony}
      <PresetStrip />
    {/if}
    <PaletteAnalysis />
    <PreviewDeck />
  </div>
</section>
