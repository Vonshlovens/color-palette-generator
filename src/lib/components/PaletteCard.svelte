<script lang="ts">
  import { generatePalette, getHarmonyName } from '$lib/color/harmonies';
  import type { HarmonyType } from '$lib/types';
  import CopyButton from './CopyButton.svelte';
  import HarmonyGlyph from './HarmonyGlyph.svelte';
  import Check from '@lucide/svelte/icons/check';
  import Link2 from '@lucide/svelte/icons/link-2';

  interface Props {
    slug: string;
    name: string;
    hue: number;
    saturation: number;
    lightness: number;
    harmony: HarmonyType;
    /** Pre-formatted date line, e.g. "Created 2026-07-28". */
    dateLabel: string;
  }

  let { slug, name, hue, saturation, lightness, harmony, dateLabel }: Props = $props();

  const colors = $derived(generatePalette({ h: hue, s: saturation, l: lightness }, harmony));
  const weights = $derived(harmony === '60-30-10' ? [6, 3, 1] : colors.map(() => 1));
  let origin = $state('');

  $effect(() => {
    origin = location.origin;
  });
</script>

<article class="panel group relative flex h-full flex-col overflow-hidden !rounded-[1.5rem] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 focus-within:-translate-y-1">
  <div class="flex h-36 gap-px p-2 pb-0" aria-hidden="true">
    {#each colors as color, index (index)}
      <span
        class="h-full grow-(--w) rounded-md transition-[flex-grow] duration-500 ease-out first:rounded-l-2xl last:rounded-r-2xl group-hover:first:grow-[calc(var(--w)*1.8)]"
        style="--w: {weights[index]}; background: {color.hex}; box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.2)"
      ></span>
    {/each}
  </div>

  <div class="flex flex-1 items-start gap-3 px-4 pt-3.5 pb-4">
    <div class="min-w-0 flex-1">
      <h3 class="font-display truncate text-lg leading-tight font-semibold" title={name}>
        <a href="/palettes/{slug}" class="outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:ring-2 focus-visible:after:ring-ring">
          {name}
        </a>
      </h3>
      <p class="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
        <HarmonyGlyph {harmony} colors={colors.map((color) => color.hex)} class="size-4" />
        {getHarmonyName(harmony)}
        <span aria-hidden="true">/</span>
        {dateLabel}
      </p>
    </div>
    <CopyButton
      value="{origin}/palettes/{slug}"
      label="share link for {name}"
      class="text-muted-foreground hover:text-foreground hover:bg-muted relative z-10 grid size-8 shrink-0 place-items-center rounded-lg transition-colors"
    >
      {#snippet children(copied)}
        {#if copied}
          <Check class="size-4" aria-hidden="true" />
        {:else}
          <Link2 class="size-4" aria-hidden="true" />
        {/if}
      {/snippet}
    </CopyButton>
  </div>
</article>
