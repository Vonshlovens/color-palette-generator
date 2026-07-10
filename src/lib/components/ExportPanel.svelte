<script lang="ts">
  import type { Color } from '$lib/types';
  import { Button } from '$lib/components/ui/button';
  import * as Tabs from '$lib/components/ui/tabs';
  import Check from '@lucide/svelte/icons/check';
  import Copy from '@lucide/svelte/icons/copy';
  import Download from '@lucide/svelte/icons/download';

  type ExportFormat = 'css' | 'tailwind' | 'json';

  interface Props {
    colors: Color[];
  }

  let { colors }: Props = $props();
  let format = $state<ExportFormat>('css');
  let copied = $state(false);

  function generateExport(selectedFormat: ExportFormat = format): string {
    switch (selectedFormat) {
      case 'css':
        return `:root {\n${colors.map((color, index) => `  --color-${index + 1}: ${color.hex};`).join('\n')}\n}`;
      case 'tailwind':
        return `colors: {\n  palette: {\n${colors.map((color, index) => `    ${(index + 1) * 100}: '${color.hex}',`).join('\n')}\n  }\n}`;
      case 'json':
        return JSON.stringify(
          colors.map(({ hex, rgb, hsl }) => ({ hex, rgb, hsl })),
          null,
          2
        );
    }
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(generateExport());
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch (error) {
      console.error('Failed to copy palette export:', error);
    }
  }

  function downloadCss() {
    const blob = new Blob([generateExport('css')], { type: 'text/css;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'color-palette.css';
    link.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="space-y-4">
  <Tabs.Root bind:value={format}>
    <Tabs.List class="grid w-full grid-cols-3">
      <Tabs.Trigger value="css">CSS</Tabs.Trigger>
      <Tabs.Trigger value="tailwind">Tailwind</Tabs.Trigger>
      <Tabs.Trigger value="json">JSON</Tabs.Trigger>
    </Tabs.List>

    {#each ['css', 'tailwind', 'json'] as exportType}
      <Tabs.Content value={exportType}>
        <pre class="bg-muted text-muted-foreground max-h-72 overflow-auto rounded-lg border p-4 text-xs leading-relaxed"><code>{generateExport(exportType as ExportFormat)}</code></pre>
      </Tabs.Content>
    {/each}
  </Tabs.Root>

  <div class="flex flex-col gap-2 sm:flex-row">
    <Button class="flex-1" onclick={copyExport}>
      {#if copied}
        <Check data-icon="inline-start" />
        Copied
      {:else}
        <Copy data-icon="inline-start" />
        Copy {format === 'css' ? 'CSS' : format === 'tailwind' ? 'Tailwind' : 'JSON'}
      {/if}
    </Button>
    <Button variant="outline" class="flex-1" onclick={downloadCss}>
      <Download data-icon="inline-start" />
      Download CSS
    </Button>
  </div>

  <p class="sr-only" aria-live="polite">{copied ? `${format} export copied` : ''}</p>
</div>
