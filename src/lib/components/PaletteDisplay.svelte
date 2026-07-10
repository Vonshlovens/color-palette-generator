<script lang="ts">
  import { paletteStore } from '$lib/stores/palette.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import ColorSwatch from './ColorSwatch.svelte';
  import ExportPanel from './ExportPanel.svelte';
  import SavePalette from './SavePalette.svelte';
  import Check from '@lucide/svelte/icons/check';
  import CodeXml from '@lucide/svelte/icons/code-xml';
  import Copy from '@lucide/svelte/icons/copy';

  let allCopied = $state(false);

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
      <Card.Description>Hover for color values and WCAG contrast. Select a swatch to copy.</Card.Description>
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

  <Card.Content>
    <Tooltip.Provider delayDuration={250}>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {#each paletteStore.colors as color, index}
          <ColorSwatch {color} {index} />
        {/each}
      </div>
    </Tooltip.Provider>
    <p class="sr-only" aria-live="polite">{allCopied ? 'All HEX values copied' : ''}</p>
  </Card.Content>
</Card.Root>
