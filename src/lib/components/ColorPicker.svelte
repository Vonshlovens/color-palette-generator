<script lang="ts">
  import { getPaletteStoreContext } from '$lib/stores/palette.svelte';
  import { hexToHsl } from '$lib/color/conversions';
  import { getSwatchLabel } from '$lib/color/harmonies';
  import { formatOklch } from '$lib/color/oklch';
  import CopyButton from './CopyButton.svelte';
  import HarmonyWheel from './HarmonyWheel.svelte';
  import Lock from '@lucide/svelte/icons/lock';
  import LockOpen from '@lucide/svelte/icons/lock-open';
  import Redo2 from '@lucide/svelte/icons/redo-2';
  import Shuffle from '@lucide/svelte/icons/shuffle';
  import Undo2 from '@lucide/svelte/icons/undo-2';

  const paletteStore = getPaletteStoreContext();
  let hexInput = $state(paletteStore.selectedColor.hex);
  let hexError = $state(false);

  const selected = $derived(paletteStore.selectedColor);
  const hsl = $derived(selected.hsl);
  const label = $derived(getSwatchLabel(paletteStore.harmony, paletteStore.selectedIndex));
  const locked = $derived(paletteStore.isLocked(paletteStore.selectedIndex));

  const channels = $derived([
    {
      id: 'hue',
      name: 'Hue',
      max: 360,
      value: hsl.h,
      unit: '°',
      track: `linear-gradient(to right, ${Array.from({ length: 7 }, (_, i) => `hsl(${i * 60} ${Math.max(hsl.s, 35)}% ${Math.min(Math.max(hsl.l, 35), 65)}%)`).join(', ')})`,
      set: (value: number) => paletteStore.setSelectedHue(value)
    },
    {
      id: 'saturation',
      name: 'Saturation',
      max: 100,
      value: hsl.s,
      unit: '%',
      track: `linear-gradient(to right, hsl(${hsl.h} 0% ${hsl.l}%), hsl(${hsl.h} 100% ${hsl.l}%))`,
      set: (value: number) => paletteStore.setSelectedSaturation(value)
    },
    {
      id: 'lightness',
      name: 'Lightness',
      max: 100,
      value: hsl.l,
      unit: '%',
      track: `linear-gradient(to right, hsl(${hsl.h} ${hsl.s}% 0%), hsl(${hsl.h} ${hsl.s}% 50%), hsl(${hsl.h} ${hsl.s}% 100%))`,
      set: (value: number) => paletteStore.setSelectedLightness(value)
    }
  ]);

  const readouts = $derived([
    { name: 'RGB', value: `rgb(${selected.rgb.r} ${selected.rgb.g} ${selected.rgb.b})` },
    { name: 'HSL', value: `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)` },
    { name: 'OKLCH', value: formatOklch(selected.rgb) }
  ]);

  function handleHexInput(event: Event) {
    let value = (event.target as HTMLInputElement).value.trim();
    if (!value.startsWith('#')) value = `#${value}`;
    hexInput = value;

    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      const next = hexToHsl(value);
      if (next) {
        paletteStore.setSelectedHsl(next);
        hexError = false;
      }
    } else {
      hexError = value.length > 1;
    }
  }

  $effect(() => {
    hexInput = paletteStore.selectedColor.hex;
    hexError = false;
  });
</script>

<section class="panel p-5" aria-labelledby="picker-heading" style="--thumb: {selected.hex}">
  <div class="mb-5 flex items-center gap-3">
    <span
      class="size-9 shrink-0 rounded-xl shadow-[inset_0_0_0_1px_oklch(0_0_0/0.12),inset_0_1px_0_oklch(1_0_0/0.3)] transition-colors duration-300"
      style="background: {selected.hex}"
      aria-hidden="true"
    ></span>
    <div class="min-w-0 flex-1">
      <h2 id="picker-heading" class="font-display truncate text-lg leading-tight font-semibold">
        {label}
      </h2>
      <p class="text-muted-foreground text-xs">
        {locked ? 'Locked, so edits stay on this swatch' : 'Siblings follow the harmony as you edit'}
      </p>
    </div>
    <button
      type="button"
      class="hover:bg-muted text-muted-foreground hover:text-foreground grid size-8 place-items-center rounded-lg transition-colors aria-pressed:text-foreground"
      aria-pressed={locked}
      aria-label={locked ? `Unlock ${label}` : `Lock ${label}`}
      title={locked ? 'Unlock (L)' : 'Lock (L)'}
      onclick={() => paletteStore.toggleLock(paletteStore.selectedIndex)}
    >
      {#if locked}
        <Lock class="size-4" aria-hidden="true" />
      {:else}
        <LockOpen class="size-4" aria-hidden="true" />
      {/if}
    </button>
  </div>

  <HarmonyWheel />

  <div class="mt-7 space-y-4">
    {#each channels as channel (channel.id)}
      <div class="grid grid-cols-[4.75rem_1fr_2.75rem] items-center gap-3">
        <label for="channel-{channel.id}" class="text-muted-foreground text-xs font-medium">
          {channel.name}
        </label>
        <input
          id="channel-{channel.id}"
          type="range"
          min="0"
          max={channel.max}
          value={channel.value}
          oninput={(event) => channel.set(Number((event.target as HTMLInputElement).value))}
          style="background: {channel.track}"
          class="w-full"
        />
        <output for="channel-{channel.id}" class="tabular text-right font-mono text-xs">
          {channel.value}{channel.unit}
        </output>
      </div>
    {/each}
  </div>

  <dl class="well mt-6 divide-y rounded-xl text-xs">
    <div class="flex items-center gap-2 px-3 py-1.5">
      <dt class="text-muted-foreground w-12 shrink-0 font-medium">
        <label for="selected-color-hex">HEX</label>
      </dt>
      <dd class="min-w-0 flex-1">
        <input
          id="selected-color-hex"
          type="text"
          value={hexInput}
          oninput={handleHexInput}
          onblur={() => {
            hexInput = selected.hex;
            hexError = false;
          }}
          maxlength={7}
          spellcheck="false"
          autocomplete="off"
          aria-invalid={hexError}
          aria-describedby={hexError ? 'hex-error' : undefined}
          class="focus-visible:ring-ring aria-invalid:text-destructive w-full rounded-md bg-transparent py-1 font-mono text-[0.8125rem] font-medium uppercase outline-none focus-visible:ring-2 focus-visible:ring-offset-0"
        />
      </dd>
      <CopyButton
        value={selected.hex}
        label="HEX {selected.hex}"
        class="text-muted-foreground hover:text-foreground hover:bg-card grid size-7 place-items-center rounded-md"
      />
    </div>
    {#each readouts as readout (readout.name)}
      <div class="flex items-center gap-2 px-3 py-1.5">
        <dt class="text-muted-foreground w-12 shrink-0 font-medium">{readout.name}</dt>
        <dd class="tabular min-w-0 flex-1 truncate py-1 font-mono text-[0.8125rem]">{readout.value}</dd>
        <CopyButton
          value={readout.value}
          label="{readout.name} {readout.value}"
          class="text-muted-foreground hover:text-foreground hover:bg-card grid size-7 place-items-center rounded-md"
        />
      </div>
    {/each}
  </dl>
  {#if hexError}
    <p id="hex-error" class="text-destructive mt-2 text-xs">Enter six hex digits, like #3B82F6.</p>
  {/if}

  <div class="mt-5 flex items-center gap-2">
    <button
      type="button"
      class="bg-primary text-primary-foreground hover:bg-primary/85 inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium shadow-[inset_0_1px_0_oklch(1_0_0/0.15),0_1px_2px_oklch(0_0_0/0.2)] transition-[background-color,transform] active:translate-y-px"
      onclick={() => paletteStore.randomize()}
    >
      <Shuffle class="size-4" aria-hidden="true" />
      Shuffle
      <kbd class="ml-1 rounded-md border border-current/25 px-1.5 font-mono text-[10px] leading-4 opacity-70">
        Space
      </kbd>
    </button>
    <div class="segmented">
      <button
        type="button"
        class="size-8 !px-0"
        onclick={() => paletteStore.undo()}
        disabled={!paletteStore.canUndo}
        aria-label="Undo"
        title="Undo (⌘Z)"
      >
        <Undo2 class="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="size-8 !px-0"
        onclick={() => paletteStore.redo()}
        disabled={!paletteStore.canRedo}
        aria-label="Redo"
        title="Redo (⇧⌘Z)"
      >
        <Redo2 class="size-4" aria-hidden="true" />
      </button>
    </div>
  </div>
</section>
