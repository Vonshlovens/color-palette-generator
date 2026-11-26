<script lang="ts">
  import type { Color } from '$lib/types';
  import { getContrastRatio, getContrastTextColor, getWcagLevel } from '$lib/color/conversions';
  import { formatOklch } from '$lib/color/oklch';
  import CopyButton from './CopyButton.svelte';
  import Lock from '@lucide/svelte/icons/lock';
  import LockOpen from '@lucide/svelte/icons/lock-open';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';

  interface Props {
    color: Color;
    index: number;
    /** Role of this slot in the harmony, e.g. "Complement". */
    label: string;
    locked?: boolean;
    selected?: boolean;
    onSelect?: (index: number) => void;
    onToggleLock?: (index: number) => void;
    /** Fine-tune lightness by a signed percentage. */
    onNudge?: (index: number, delta: number) => void;
  }

  let {
    color,
    index,
    label,
    locked = false,
    selected = false,
    onSelect,
    onToggleLock,
    onNudge
  }: Props = $props();

  const dark = $derived(getContrastTextColor(color.rgb) === 'dark');
  const ink = $derived(dark ? 'oklch(0.18 0.01 264)' : '#ffffff');
  const contrast = $derived([
    { name: 'White', ratio: getContrastRatio(color.rgb, { r: 255, g: 255, b: 255 }) },
    { name: 'Black', ratio: getContrastRatio(color.rgb, { r: 0, g: 0, b: 0 }) }
  ]);
  const chip =
    'grid size-8 place-items-center rounded-lg backdrop-blur-sm transition-[opacity,background-color] outline-none hover:bg-current/15 focus-visible:ring-2 focus-visible:ring-current';
</script>

<article
  class="group @container relative isolate flex min-h-52 min-w-0 flex-col justify-between overflow-hidden rounded-[1.375rem] p-3.5 transition-[background-color,color,transform,box-shadow] duration-300 ease-out sm:min-h-64 {selected
    ? 'outline-foreground -translate-y-1 outline-2 outline-offset-[3px]'
    : 'hover:-translate-y-0.5'}"
  style="background-color: {color.hex}; color: {ink}; box-shadow: inset 0 0 0 1px oklch(0 0 0 / 0.08), inset 0 1px 0 oklch(1 0 0 / 0.22), 0 {selected
    ? '18px 36px -18px'
    : '8px 20px -14px'} color-mix(in oklab, {color.hex} 70%, black);"
  aria-label="{label}, {color.hex}"
>
  <!-- The whole card selects; controls sit above it. -->
  <button
    type="button"
    class="absolute inset-0 -z-10 rounded-[inherit] outline-none focus-visible:ring-3 focus-visible:ring-current focus-visible:ring-inset"
    onclick={() => onSelect?.(index)}
    aria-pressed={selected}
    aria-label="Edit {label}, {color.hex}"
  ></button>
  <!-- Soft sheen so each card reads as a physical chip. -->
  <span
    class="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(160deg,oklch(1_0_0/0.16),transparent_38%)]"
    aria-hidden="true"
  ></span>

  <div class="pointer-events-none flex items-start justify-between gap-2">
    <span class="flex min-w-0 items-center gap-1.5 pt-1.5 pl-1 text-xs font-medium">
      <span class="truncate">{label}</span>
      {#if locked}<Lock class="size-3 shrink-0 opacity-80" aria-hidden="true" />{/if}
    </span>
    <div class="pointer-events-auto flex shrink-0 items-center">
      {#if onToggleLock}
        <button
          type="button"
          class="{chip} {locked ? 'opacity-100' : 'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100'}"
          onclick={() => onToggleLock(index)}
          aria-pressed={locked}
          aria-label={locked ? `Unlock ${label}` : `Lock ${label}`}
          title={locked ? 'Unlock' : 'Lock'}
        >
          {#if locked}
            <Lock class="size-4" aria-hidden="true" />
          {:else}
            <LockOpen class="size-4" aria-hidden="true" />
          {/if}
        </button>
      {/if}
      <CopyButton
        value={color.hex}
        label="{label} {color.hex}"
        class="{chip} opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
      />
    </div>
  </div>

  <div class="pointer-events-none space-y-2.5 pl-1">
    <div>
      <p class="tabular font-mono text-[0.8rem] leading-none font-semibold tracking-tight uppercase @[9rem]:text-lg @[13rem]:text-xl">
        {color.hex}
      </p>
      <p class="tabular mt-1.5 hidden truncate font-mono text-[11px] opacity-75 @[9rem]:block">{formatOklch(color.rgb)}</p>
    </div>

    <div class="hidden flex-wrap items-center gap-1.5 @[9rem]:flex">
      {#each contrast as item (item.name)}
        {@const level = getWcagLevel(item.ratio)}
        <span
          class="tabular inline-flex items-center gap-1 rounded-full py-0.5 pr-2 pl-0.5 font-mono text-[10px] {level ===
          'Fail'
            ? 'opacity-55'
            : ''}"
          style="background: color-mix(in oklab, currentColor 12%, transparent)"
          title="{item.name} text: {item.ratio.toFixed(2)}:1, {level}"
        >
          <span
            class="grid size-4 place-items-center rounded-full font-sans text-[9px] font-semibold"
            style="background: {item.name === 'White' ? '#fff' : '#000'}; color: {item.name === 'White'
              ? '#000'
              : '#fff'}"
            aria-hidden="true">A</span
          >
          {item.ratio.toFixed(1)}
          {level === 'AA Large' ? 'AA18' : level}
        </span>
      {/each}

      {#if onNudge}
        <span
          class="pointer-events-auto ml-auto inline-flex items-center rounded-full opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          style="background: color-mix(in oklab, currentColor 12%, transparent)"
        >
          <button
            type="button"
            class="grid size-6 place-items-center rounded-full outline-none hover:bg-current/15 focus-visible:ring-2 focus-visible:ring-current"
            onclick={() => onNudge(index, -4)}
            aria-label="Darken {label}"
            title="Darken 4%"
          >
            <Minus class="size-3" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="grid size-6 place-items-center rounded-full outline-none hover:bg-current/15 focus-visible:ring-2 focus-visible:ring-current"
            onclick={() => onNudge(index, 4)}
            aria-label="Lighten {label}"
            title="Lighten 4%"
          >
            <Plus class="size-3" aria-hidden="true" />
          </button>
        </span>
      {/if}
    </div>
  </div>
</article>
