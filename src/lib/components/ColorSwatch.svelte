<script lang="ts">
  import type { Color } from '$lib/types';
  import { getContrastRatio, getContrastTextColor } from '$lib/color/conversions';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import Check from '@lucide/svelte/icons/check';
  import Copy from '@lucide/svelte/icons/copy';

  interface Props {
    color: Color;
    index: number;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
    onCopy?: (index: number) => void;
  }

  let { color, index, size = 'large', showLabel = true, onCopy }: Props = $props();

  let copied = $state(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(color.hex);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 1500);
      onCopy?.(index);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  const textColor = $derived(getContrastTextColor(color.rgb));
  const whiteContrast = $derived(getContrastRatio(color.rgb, { r: 255, g: 255, b: 255 }));
  const blackContrast = $derived(getContrastRatio(color.rgb, { r: 0, g: 0, b: 0 }));
  const sizeClass = $derived(
    {
      small: 'min-h-28',
      medium: 'min-h-36',
      large: 'min-h-48'
    }[size]
  );
</script>

<Tooltip.Root>
  <Tooltip.Trigger>
    {#snippet child({ props })}
      <button
        {...props}
        type="button"
        class="{sizeClass} group relative flex w-full min-w-0 flex-col justify-between overflow-hidden rounded-xl border p-3 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-0"
        style="background-color: {color.hex}; color: {textColor === 'dark' ? '#111827' : '#ffffff'}"
        onclick={copyToClipboard}
        aria-label="Copy {color.hex}, palette color {index + 1}"
      >
        <span class="flex w-full items-center justify-between text-xs font-medium opacity-75">
          <span>0{index + 1}</span>
          {#if copied}
            <Check class="size-4" aria-hidden="true" />
          {:else}
            <Copy class="size-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" />
          {/if}
        </span>
        {#if showLabel}
          <span class="font-mono text-sm font-semibold tracking-wide uppercase">
            {copied ? 'Copied!' : color.hex}
          </span>
        {/if}
      </button>
    {/snippet}
  </Tooltip.Trigger>
  <Tooltip.Content class="block max-w-72 p-3" sideOffset={8}>
    <div class="space-y-2">
      <div class="grid grid-cols-[2.5rem_1fr] gap-x-2 font-mono">
        <span class="opacity-70">HEX</span><span>{color.hex.toUpperCase()}</span>
        <span class="opacity-70">RGB</span><span>{color.rgb.r}, {color.rgb.g}, {color.rgb.b}</span>
        <span class="opacity-70">HSL</span><span>{color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%</span>
      </div>
      <div class="border-background/20 flex gap-3 border-t pt-2">
        <span>White {whiteContrast.toFixed(2)}:1</span>
        <span>Black {blackContrast.toFixed(2)}:1</span>
      </div>
    </div>
  </Tooltip.Content>
</Tooltip.Root>

<span class="sr-only" aria-live="polite">{copied ? `${color.hex} copied` : ''}</span>
