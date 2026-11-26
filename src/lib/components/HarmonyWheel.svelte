<script lang="ts">
  import { getPaletteStoreContext } from '$lib/stores/palette.svelte';
  import { getSwatchLabel } from '$lib/color/harmonies';

  const paletteStore = getPaletteStoreContext();

  let wheel = $state<HTMLDivElement>();
  let dragging = $state(false);

  const selected = $derived(paletteStore.selectedColor.hsl);
  const selectedLabel = $derived(getSwatchLabel(paletteStore.harmony, paletteStore.selectedIndex));

  /** Marker positions in percent of the wheel box, with hue clockwise from 12 o'clock. */
  const markers = $derived(
    paletteStore.colors.map((color, index) => {
      const radians = (color.hsl.h * Math.PI) / 180;
      const radius = (color.hsl.s / 100) * 50;
      return {
        index,
        color,
        x: 50 + radius * Math.sin(radians),
        y: 50 - radius * Math.cos(radians),
        locked: paletteStore.isLocked(index),
        selected: paletteStore.selectedIndex === index
      };
    })
  );

  const hueStops = $derived(
    Array.from({ length: 13 }, (_, i) => `hsl(${i * 30} 100% ${selected.l}%)`).join(', ')
  );

  function pointerToHueSaturation(event: PointerEvent) {
    const rect = wheel!.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const h = Math.round(((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360);
    const s = Math.round(Math.min(1, Math.hypot(dx, dy) / (rect.width / 2)) * 100);
    return { h, s };
  }

  function apply(event: PointerEvent) {
    const { h, s } = pointerToHueSaturation(event);
    paletteStore.setSelectedHsl({ h, s, l: paletteStore.selectedColor.hsl.l });
  }

  function startDrag(event: PointerEvent, index?: number) {
    if (event.button !== 0) return;
    event.preventDefault();
    if (index !== undefined) paletteStore.selectColor(index);
    wheel?.setPointerCapture(event.pointerId);
    wheel?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
    dragging = true;
    // Grabbing a marker shouldn't snap it to the exact pointer; clicking the wheel should.
    if (index === undefined) apply(event);
  }

  function moveDrag(event: PointerEvent) {
    if (dragging) apply(event);
  }

  function endDrag(event: PointerEvent) {
    dragging = false;
    if (wheel?.hasPointerCapture(event.pointerId)) wheel.releasePointerCapture(event.pointerId);
  }

  function handleKeydown(event: KeyboardEvent) {
    const step = event.shiftKey ? 10 : 1;
    const { h, s, l } = paletteStore.selectedColor.hsl;
    let next: { h: number; s: number } | null = null;
    if (event.key === 'ArrowRight') next = { h: (h + step) % 360, s };
    if (event.key === 'ArrowLeft') next = { h: (h - step + 360) % 360, s };
    if (event.key === 'ArrowUp') next = { h, s: Math.min(100, s + step) };
    if (event.key === 'ArrowDown') next = { h, s: Math.max(0, s - step) };
    if (!next) return;
    event.preventDefault();
    paletteStore.setSelectedHsl({ ...next, l });
  }
</script>

<div class="relative mx-auto aspect-square w-full max-w-[17rem] select-none">
  <!-- Bezel: a soft recessed ring so the wheel sits in the panel like a dial. -->
  <div
    class="well absolute -inset-2.5 rounded-full"
    aria-hidden="true"
  ></div>

  <div
    bind:this={wheel}
    class="absolute inset-0 touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-card {dragging
      ? 'cursor-grabbing'
      : 'cursor-crosshair'}"
    style="background:
      radial-gradient(circle closest-side, hsl(0 0% {selected.l}%), hsl(0 0% {selected.l}% / 0) 100%),
      conic-gradient({hueStops});
      box-shadow: inset 0 0 0 1px oklch(0 0 0 / 0.12), inset 0 2px 10px oklch(0 0 0 / 0.18);"
    role="slider"
    tabindex="0"
    aria-label="Hue and saturation of {selectedLabel}. Arrow keys: left and right change hue, up and down change saturation."
    aria-valuemin={0}
    aria-valuemax={360}
    aria-valuenow={selected.h}
    aria-valuetext="Hue {selected.h} degrees, saturation {selected.s} percent"
    onpointerdown={(event) => startDrag(event)}
    onpointermove={moveDrag}
    onpointerup={endDrag}
    onpointercancel={endDrag}
    onkeydown={handleKeydown}
  >
    <svg viewBox="0 0 100 100" class="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden="true">
      {#if markers.length > 2}
        <polygon
          points={markers.map((m) => `${m.x},${m.y}`).join(' ')}
          fill="oklch(1 0 0 / 0.14)"
          stroke="white"
          stroke-opacity="0.85"
          stroke-width="0.6"
          stroke-linejoin="round"
        />
      {/if}
      {#each markers as marker}
        <line
          x1="50"
          y1="50"
          x2={marker.x}
          y2={marker.y}
          stroke="white"
          stroke-opacity={marker.selected ? 0.95 : 0.55}
          stroke-width={marker.selected ? 0.8 : 0.5}
          stroke-dasharray={marker.locked ? '1.4 1.2' : undefined}
        />
      {/each}
      <circle cx="50" cy="50" r="1.4" fill="white" />
    </svg>

    {#each markers as marker (marker.index)}
      <button
        type="button"
        tabindex="-1"
        class="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-white transition-[width,height,box-shadow] duration-150 {marker.selected
          ? 'z-10 size-7 border-[3px]'
          : 'size-[1.125rem] border-2 hover:size-5'} {dragging && marker.selected
          ? 'cursor-grabbing'
          : 'cursor-grab'}"
        style="left: {marker.x}%; top: {marker.y}%; background: {marker.color.hex}; box-shadow: 0 0 0 1px oklch(0 0 0 / 0.25), 0 3px 10px oklch(0 0 0 / 0.35){marker.locked
          ? ', 0 0 0 4px oklch(1 0 0 / 0.55)'
          : ''};"
        aria-label="Edit {getSwatchLabel(paletteStore.harmony, marker.index)}"
        onpointerdown={(event) => {
          event.stopPropagation();
          startDrag(event, marker.index);
        }}
      ></button>
    {/each}
  </div>
</div>
