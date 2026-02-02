<script lang="ts">
  import { paletteStore } from '$lib/stores/palette.svelte';
  import ColorSwatch from './ColorSwatch.svelte';

  let exportFormat = $state<'css' | 'tailwind' | 'json'>('css');
  let showExport = $state(false);
  let exportCopied = $state(false);

  function generateExport(): string {
    const colors = paletteStore.colors;

    switch (exportFormat) {
      case 'css':
        return `:root {\n${colors.map((c, i) => `  --color-${i + 1}: ${c.hex};`).join('\n')}\n}`;
      case 'tailwind':
        return `colors: {\n  palette: {\n${colors.map((c, i) => `    ${(i + 1) * 100}: '${c.hex}',`).join('\n')}\n  }\n}`;
      case 'json':
        return JSON.stringify(colors.map(c => c.hex), null, 2);
      default:
        return '';
    }
  }

  async function copyExport() {
    try {
      await navigator.clipboard.writeText(generateExport());
      exportCopied = true;
      setTimeout(() => {
        exportCopied = false;
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  async function copyAllHex() {
    const hexValues = paletteStore.colors.map(c => c.hex).join('\n');
    try {
      await navigator.clipboard.writeText(hexValues);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
</script>

<div class="palette-display">
  <div class="palette-header">
    <h2>Generated Palette</h2>
    <div class="actions">
      <button class="action-btn" onclick={copyAllHex}>
        Copy All
      </button>
      <button class="action-btn" onclick={() => showExport = !showExport}>
        Export
      </button>
    </div>
  </div>

  <div class="swatches">
    {#each paletteStore.colors as color, index}
      <ColorSwatch {color} {index} />
    {/each}
  </div>

  {#if showExport}
    <div class="export-panel">
      <div class="export-tabs">
        <button
          class="export-tab"
          class:active={exportFormat === 'css'}
          onclick={() => exportFormat = 'css'}
        >
          CSS
        </button>
        <button
          class="export-tab"
          class:active={exportFormat === 'tailwind'}
          onclick={() => exportFormat = 'tailwind'}
        >
          Tailwind
        </button>
        <button
          class="export-tab"
          class:active={exportFormat === 'json'}
          onclick={() => exportFormat = 'json'}
        >
          JSON
        </button>
      </div>
      <pre class="export-code">{generateExport()}</pre>
      <button class="copy-export-btn" onclick={copyExport}>
        {exportCopied ? 'Copied!' : 'Copy to Clipboard'}
      </button>
    </div>
  {/if}
</div>

<style>
  .palette-display {
    background: var(--bg-surface);
    border-radius: 12px;
    padding: 20px;
  }

  .palette-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    background: var(--bg-elevated);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 8px 16px;
    color: var(--text-primary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .action-btn:hover {
    background: var(--border-color);
  }

  .swatches {
    display: flex;
    gap: 12px;
  }

  .export-panel {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
  }

  .export-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 12px;
  }

  .export-tab {
    background: transparent;
    border: none;
    padding: 8px 16px;
    color: var(--text-secondary);
    font-size: 13px;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s ease;
  }

  .export-tab:hover {
    color: var(--text-primary);
  }

  .export-tab.active {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }

  .export-code {
    background: var(--bg-elevated);
    border-radius: 8px;
    padding: 16px;
    margin: 0;
    font-family: monospace;
    font-size: 13px;
    overflow-x: auto;
    color: var(--text-secondary);
  }

  .copy-export-btn {
    margin-top: 12px;
    width: 100%;
    background: #3b82f6;
    border: none;
    border-radius: 6px;
    padding: 10px 16px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .copy-export-btn:hover {
    background: #2563eb;
  }
</style>
