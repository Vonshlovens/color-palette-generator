<script lang="ts">
  import {
    getPaletteStoreContext,
    setPaletteStoreContext
  } from '$lib/stores/palette.svelte';
  import { getHarmonyDescription, getHarmonyName } from '$lib/color/harmonies';
  import type { PaletteSnapshot } from '$lib/types';
  import * as Card from '$lib/components/ui/card';
  import ColorPicker from './ColorPicker.svelte';
  import HarmonySelector from './HarmonySelector.svelte';
  import PaletteDisplay from './PaletteDisplay.svelte';

  interface Props {
    initialSnapshot?: PaletteSnapshot;
  }

  let { initialSnapshot }: Props = $props();

  function initializePaletteStore(): void {
    setPaletteStoreContext(initialSnapshot);
  }

  initializePaletteStore();
  const paletteStore = getPaletteStoreContext();
</script>

<section
  class="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]"
  aria-label="Palette editor"
  style:--workspace-accent={paletteStore.baseColor.hex}
>
  <div class="space-y-6">
    <ColorPicker />
    <HarmonySelector />
  </div>

  <div class="min-w-0 space-y-6">
    <PaletteDisplay />

    <Card.Root size="sm" class="relative">
      <span
        class="absolute inset-y-0 left-0 w-1"
        style="background-color: var(--workspace-accent)"
        aria-hidden="true"
      ></span>
      <Card.Header class="pl-6">
        <Card.Title>About {getHarmonyName(paletteStore.harmony)}</Card.Title>
        <Card.Description class="max-w-2xl leading-relaxed">
          {getHarmonyDescription(paletteStore.harmony)}. The palette shows
          {paletteStore.colors.length} color{paletteStore.colors.length === 1 ? '' : 's'} that match
          this relationship, keeping your selected base color in HSL while deriving supporting hues.
        </Card.Description>
      </Card.Header>
    </Card.Root>
  </div>
</section>
