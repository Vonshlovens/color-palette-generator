<script lang="ts">
  import { getPaletteStoreContext } from '$lib/stores/palette.svelte';
  import {
    getHarmonyLayoutClass,
    SIXTY_THIRTY_TEN_ROLES
  } from '$lib/color/harmonies';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import ColorSwatch from './ColorSwatch.svelte';
  import ExportPanel from './ExportPanel.svelte';
  import SavePalette from './SavePalette.svelte';
  import WebsitePreview from './WebsitePreview.svelte';
  import Check from '@lucide/svelte/icons/check';
  import CodeXml from '@lucide/svelte/icons/code-xml';
  import Copy from '@lucide/svelte/icons/copy';

  const paletteStore = getPaletteStoreContext();
  let allCopied = $state(false);

  const layoutClass = $derived(
    getHarmonyLayoutClass(paletteStore.harmony, paletteStore.colors.length)
  );
  const isSixtyThirtyTen = $derived(paletteStore.harmony === '60-30-10');

  async function copyAllHex() {
    const hexValues = paletteStore.colors.map(c => c.hex).join('\n');
    try {
      await navigator.clipboard.writeText(hexValues);
      allCopied = true;
      setTimeout(() => (allCopied = false), 1500);
    } catch (error) {
      console.error('Failed to copy palette:', error);
    }
  }
</script>

<Card.Root>
  <Card.Header class="border-b sm:grid-cols-[1fr_auto]">
    <div>
      <Card.Title>Generated palette</Card.Title>
      <Card.Description>
        {#if isSixtyThirtyTen}
          Click a role to edit it. Lock any swatch to keep it fixed while you tweak others.
        {:else}
          Click a swatch to edit it. {paletteStore.colors.length} colors for this harmony — lock any
          to keep it fixed.
        {/if}
      </Card.Description>
    </div>
    <Card.Action class="mt-3 flex flex-wrap gap-2 sm:mt-0">
      <SavePalette />
      <Button variant="outline" size="sm" onclick={copyAllHex}>
        {#if allCopied}
          <Check data-icon="inline-start" />
          Copied
        {:else}
          <Copy data-icon="inline-start" />
          Copy all
        {/if}
      </Button>
      <Dialog.Root>
        <Dialog.Trigger>
          {#snippet child({ props })}
            <Button {...props} size="sm">
              <CodeXml data-icon="inline-start" />
              Export
            </Button>
          {/snippet}
        </Dialog.Trigger>
        <Dialog.Content class="sm:max-w-2xl">
          <Dialog.Header>
            <Dialog.Title>Export palette</Dialog.Title>
            <Dialog.Description>Copy a ready-to-use format or download CSS variables.</Dialog.Description>
          </Dialog.Header>
          <ExportPanel colors={paletteStore.colors} />
        </Dialog.Content>
      </Dialog.Root>
    </Card.Action>
  </Card.Header>

  <Card.Content class="space-y-6">
    <Tooltip.Provider delayDuration={250}>
      <div class={layoutClass}>
        {#each paletteStore.colors as color, index}
          <ColorSwatch
            {color}
            {index}
            roleLabel={isSixtyThirtyTen ? SIXTY_THIRTY_TEN_ROLES[index] : undefined}
            locked={paletteStore.isLocked(index)}
            selected={paletteStore.selectedIndex === index}
            onSelect={(i) => paletteStore.selectColor(i)}
            onToggleLock={(i) => paletteStore.toggleLock(i)}
          />
        {/each}
      </div>
    </Tooltip.Provider>

    {#if paletteStore.lockedCount > 0}
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-muted-foreground text-xs">
          {paletteStore.lockedCount} locked color{paletteStore.lockedCount === 1 ? '' : 's'} — unlock or clear to let them follow the base again.
        </p>
        <Button variant="ghost" size="sm" onclick={() => paletteStore.clearLocks()}>
          Clear locks
        </Button>
      </div>
    {/if}

    {#if isSixtyThirtyTen}
      <WebsitePreview colors={paletteStore.colors} />
    {/if}

    <p class="sr-only" aria-live="polite">{allCopied ? 'All HEX values copied' : ''}</p>
  </Card.Content>
</Card.Root>
