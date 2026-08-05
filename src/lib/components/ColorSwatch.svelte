<script lang="ts">
  import type { Color } from '$lib/types';
  import { getContrastRatio, getContrastTextColor } from '$lib/color/conversions';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import Check from '@lucide/svelte/icons/check';
  import Copy from '@lucide/svelte/icons/copy';
  import Lock from '@lucide/svelte/icons/lock';
  import LockOpen from '@lucide/svelte/icons/lock-open';

  interface Props {
    color: Color;
    index: number;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
    roleLabel?: string;
    locked?: boolean;
    selected?: boolean;
    onSelect?: (index: number) => void;
    onCopy?: (index: number) => void;
    onToggleLock?: (index: number) => void;
  }

  let {
    color,
    index,
    size = 'large',
    showLabel = true,
    roleLabel,
    locked = false,
    selected = false,
    onSelect,
    onCopy,
    onToggleLock
  }: Props = $props();

  let copied = $state(false);

  function formatHslChannel(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  async function copyToClipboard(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
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

  function handleSelect() {
    onSelect?.(index);
  }

  function handleLockClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onToggleLock?.(index);
  }

  const textColor = $derived(getContrastTextColor(color.rgb));
  const foreground = $derived(textColor === 'dark' ? '#111827' : '#ffffff');
  const whiteContrast = $derived(getContrastRatio(color.rgb, { r: 255, g: 255, b: 255 }));
  const blackContrast = $derived(getContrastRatio(color.rgb, { r: 0, g: 0, b: 0 }));
  const sizeClass = $derived(
    {
      small: 'min-h-28',
      medium: 'min-h-36',
      large: 'min-h-48'
    }[size]
  );
  const label = $derived(roleLabel ?? `Color ${index + 1}`);
</script>

<Tooltip.Root>
  <Tooltip.Trigger>
    {#snippet child({ props })}
      <div
        {...props}
        class="{sizeClass} group relative flex w-full min-w-0 flex-col justify-between overflow-hidden rounded-xl border p-3 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg {selected
          ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
          : locked
            ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-black/20'
            : ''}"
        style="background-color: {color.hex}; color: {foreground}"
      >
        <div class="flex w-full items-start justify-between gap-2 text-xs font-medium opacity-90">
          <button
            type="button"
            class="min-w-0 flex-1 rounded-md text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            onclick={handleSelect}
            aria-pressed={selected}
            aria-label="Edit {label}, {color.hex}"
          >
            <span class="block truncate">{roleLabel ?? `0${index + 1}`}</span>
          </button>
          <div class="flex shrink-0 items-center gap-1">
            {#if onToggleLock}
              <button
                type="button"
                class="rounded-md p-1 transition-opacity hover:bg-black/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:hover:bg-white/15 {locked
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}"
                onclick={handleLockClick}
                aria-pressed={locked}
                aria-label={locked
                  ? `Unlock palette color ${index + 1}`
                  : `Lock palette color ${index + 1}`}
                title={locked ? 'Unlock color' : 'Lock color'}
              >
                {#if locked}
                  <Lock class="size-4" aria-hidden="true" />
                {:else}
                  <LockOpen class="size-4" aria-hidden="true" />
                {/if}
              </button>
            {/if}
            <button
              type="button"
              class="rounded-md p-1 transition-opacity hover:bg-black/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none dark:hover:bg-white/15 {copied
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}"
              onclick={copyToClipboard}
              aria-label="Copy {color.hex}"
              title="Copy HEX"
            >
              {#if copied}
                <Check class="size-4" aria-hidden="true" />
              {:else}
                <Copy class="size-4" aria-hidden="true" />
              {/if}
            </button>
          </div>
        </div>
        {#if showLabel}
          <button
            type="button"
            class="font-mono text-sm font-semibold tracking-wide uppercase focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            onclick={handleSelect}
            aria-pressed={selected}
            aria-label="Edit {label}"
          >
            {color.hex}
            {#if selected}
              <span class="mt-1 block text-[10px] font-medium tracking-wide uppercase opacity-80">
                Editing
              </span>
            {:else if locked}
              <span class="mt-1 block text-[10px] font-medium tracking-wide uppercase opacity-80">
                Locked
              </span>
            {/if}
          </button>
        {/if}
      </div>
    {/snippet}
  </Tooltip.Trigger>
  <Tooltip.Content class="block max-w-72 p-3" sideOffset={8}>
    <div class="space-y-2">
      <p class="text-xs font-medium">{selected ? 'Selected for editing' : 'Click to edit'}</p>
      <div class="grid grid-cols-[2.5rem_1fr] gap-x-2 font-mono">
        <span class="opacity-70">HEX</span><span>{color.hex.toUpperCase()}</span>
        <span class="opacity-70">RGB</span><span>{color.rgb.r}, {color.rgb.g}, {color.rgb.b}</span>
        <span class="opacity-70">HSL</span
        ><span
          >{formatHslChannel(color.hsl.h)}°, {formatHslChannel(color.hsl.s)}%, {formatHslChannel(
            color.hsl.l
          )}%</span
        >
      </div>
      <div class="border-background/20 flex gap-3 border-t pt-2">
        <span>White {whiteContrast.toFixed(2)}:1</span>
        <span>Black {blackContrast.toFixed(2)}:1</span>
      </div>
      {#if locked}
        <p class="border-background/20 border-t pt-2 text-xs">
          Locked — stays fixed while you change other colors or randomize.
        </p>
      {/if}
    </div>
  </Tooltip.Content>
</Tooltip.Root>

<span class="sr-only" aria-live="polite">{copied ? `${color.hex} copied` : ''}</span>
