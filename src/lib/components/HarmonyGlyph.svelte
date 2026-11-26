<script lang="ts">
  import { HARMONY_ANGLES } from '$lib/color/harmonies';
  import type { PaletteKind } from '$lib/types';

  interface Props {
    harmony: PaletteKind;
    /** Fill each point with the palette color at that slot; falls back to currentColor. */
    colors?: string[];
    class?: string;
  }

  let { harmony, colors, class: className = 'size-6' }: Props = $props();

  /** Freeform has no rule, so its glyph is a loose scatter of swatches. */
  const SCATTER = [
    { x: 8.4, y: 8.6, r: 2.4 },
    { x: 15.6, y: 9.8, r: 1.9 },
    { x: 10.6, y: 15.8, r: 2.1 },
    { x: 16.2, y: 15.4, r: 1.5 }
  ];

  const points = $derived(
    (harmony === 'freeform' ? [] : HARMONY_ANGLES[harmony]).map((angle) => {
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
  {#if harmony === 'freeform'}
    {#each SCATTER as dot, index}
      <circle
        cx={dot.x}
        cy={dot.y}
        r={dot.r}
        fill={colors?.[index % colors.length] ?? 'currentColor'}
        opacity={colors ? 1 : 1 - index * 0.18}
      />
    {/each}
  {:else if isMono}
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
