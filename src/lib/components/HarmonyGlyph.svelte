<script lang="ts">
  import { HARMONY_ANGLES } from '$lib/color/harmonies';
  import type { HarmonyType } from '$lib/types';

  interface Props {
    harmony: HarmonyType;
    /** Fill each point with the palette color at that slot; falls back to currentColor. */
    colors?: string[];
    class?: string;
  }

  let { harmony, colors, class: className = 'size-6' }: Props = $props();

  const points = $derived(
    HARMONY_ANGLES[harmony].map((angle) => {
      const radians = (angle * Math.PI) / 180;
      return { x: 12 + 8.5 * Math.sin(radians), y: 12 - 8.5 * Math.cos(radians) };
    })
  );
  const polygon = $derived(points.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' '));
  const isMono = $derived(harmony === 'monochromatic');
  const isRule = $derived(harmony === '60-30-10');
</script>

<svg viewBox="0 0 24 24" class={className} aria-hidden="true" fill="none">
  <circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-opacity="0.28" stroke-width="1.25" />
  {#if isMono}
    {#each [8.5, 6, 3.5] as radius, index}
      <circle
        cx="12"
        cy={12 - radius}
        r="1.9"
        fill={colors?.[index * 2] ?? 'currentColor'}
        opacity={colors ? 1 : 1 - index * 0.25}
      />
    {/each}
    <line x1="12" y1="12" x2="12" y2="3.5" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.1" />
  {:else if isRule}
    <path d="M12 12 L12 3.5 A8.5 8.5 0 1 1 4.9 16.7 Z" fill="currentColor" fill-opacity="0.16" />
    <path d="M12 12 L4.9 16.7 A8.5 8.5 0 0 1 7.5 4.8 Z" fill="currentColor" fill-opacity="0.38" />
    <circle cx="12" cy="20.5" r="2" fill={colors?.[2] ?? 'currentColor'} />
  {:else}
    {#if points.length > 2}
      <polygon points={polygon} stroke="currentColor" stroke-opacity="0.5" stroke-width="1.1" />
    {:else}
      <line
        x1={points[0].x}
        y1={points[0].y}
        x2={points[points.length - 1].x}
        y2={points[points.length - 1].y}
        stroke="currentColor"
        stroke-opacity="0.5"
        stroke-width="1.1"
      />
    {/if}
    {#each points as point, index}
      <circle cx={point.x} cy={point.y} r="2.1" fill={colors?.[index] ?? 'currentColor'} />
    {/each}
  {/if}
</svg>
