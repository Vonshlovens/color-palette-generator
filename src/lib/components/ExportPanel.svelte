<script lang="ts">
  import type { Color, PaletteKind } from '$lib/types';
  import {
    buildExport,
    EXPORT_FORMAT_INFO,
    EXPORT_FORMATS,
    type ExportFormat
  } from '$lib/color/exports';
  import CopyButton from './CopyButton.svelte';
  import Check from '@lucide/svelte/icons/check';
  import Copy from '@lucide/svelte/icons/copy';
  import Download from '@lucide/svelte/icons/download';

  interface Props {
    colors: Color[];
    harmony: PaletteKind;
    name: string;
  }

  let { colors, harmony, name }: Props = $props();
  let format = $state<ExportFormat>('css');

  const info = $derived(EXPORT_FORMAT_INFO[format]);
  const output = $derived(buildExport(format, { name, harmony, colors }));
  const svgPreview = $derived(
    format === 'svg' ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(output)}` : ''
  );

  function download() {
    const blob = new Blob([output], { type: `${info.mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = info.filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const index = EXPORT_FORMATS.indexOf(format);
    const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + EXPORT_FORMATS.length) % EXPORT_FORMATS.length;
    format = EXPORT_FORMATS[next];
    (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  }
</script>

<div class="min-w-0 space-y-4">
  <div class="-mx-1 overflow-x-auto px-1 pb-1">
    <div class="segmented" role="tablist" aria-label="Export format" tabindex="-1" onkeydown={handleKeydown}>
      {#each EXPORT_FORMATS as option (option)}
        <button
          type="button"
          role="tab"
          id="export-tab-{option}"
          aria-selected={format === option}
          aria-controls="export-output"
          tabindex={format === option ? 0 : -1}
          onclick={() => (format = option)}
        >
          {EXPORT_FORMAT_INFO[option].label}
        </button>
      {/each}
    </div>
  </div>

  <div id="export-output" role="tabpanel" aria-labelledby="export-tab-{format}" class="space-y-3">
    <p class="text-muted-foreground text-sm">{info.description}</p>

    {#if format === 'svg'}
      <img
        src={svgPreview}
        alt="Palette card preview for {name}"
        class="w-full rounded-2xl border shadow-sm"
        width="1200"
        height="630"
      />
    {:else}
      <pre
        class="well tabular max-h-[22rem] overflow-auto rounded-2xl p-4 font-mono text-[12px] leading-relaxed"><code>{output}</code></pre>
    {/if}
  </div>

  <div class="flex flex-col gap-2 sm:flex-row">
    <CopyButton
      value={output}
      label="{info.label} export"
      class="bg-primary text-primary-foreground hover:bg-primary/85 inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {#snippet children(copied)}
        {#if copied}
          <Check class="size-4" aria-hidden="true" /> Copied {info.label}
        {:else}
          <Copy class="size-4" aria-hidden="true" /> Copy {info.label}
        {/if}
      {/snippet}
    </CopyButton>
    <button
      type="button"
      class="bg-card hover:bg-muted inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onclick={download}
    >
      <Download class="size-4" aria-hidden="true" />
      Download {info.filename}
    </button>
  </div>
</div>
