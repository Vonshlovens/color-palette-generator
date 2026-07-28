<script lang="ts">
  import type { Color } from '$lib/types';
  import { getContrastTextColor } from '$lib/color/conversions';
  import { SIXTY_THIRTY_TEN_ROLES } from '$lib/color/harmonies';

  interface Props {
    colors: Color[];
  }

  let { colors }: Props = $props();

  const dominant = $derived(colors[0]);
  const secondary = $derived(colors[1]);
  const accent = $derived(colors[2]);

  const dominantText = $derived(getContrastTextColor(dominant.rgb) === 'dark' ? '#111827' : '#ffffff');
  const secondaryText = $derived(
    getContrastTextColor(secondary.rgb) === 'dark' ? '#111827' : '#ffffff'
  );
  const accentText = $derived(getContrastTextColor(accent.rgb) === 'dark' ? '#111827' : '#ffffff');
</script>

{#if dominant && secondary && accent}
  <div class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p class="text-sm font-medium">Website preview</p>
        <p class="text-muted-foreground text-xs">
          Abstract layout showing how a 60-30-10 palette might appear on a page.
        </p>
      </div>
      <div class="flex flex-wrap gap-2 text-[10px] font-medium tracking-wide uppercase">
        <span class="rounded-full px-2 py-1" style="background-color: {dominant.hex}; color: {dominantText}">
          {SIXTY_THIRTY_TEN_ROLES[0]}
        </span>
        <span class="rounded-full px-2 py-1" style="background-color: {secondary.hex}; color: {secondaryText}">
          {SIXTY_THIRTY_TEN_ROLES[1]}
        </span>
        <span class="rounded-full px-2 py-1" style="background-color: {accent.hex}; color: {accentText}">
          {SIXTY_THIRTY_TEN_ROLES[2]}
        </span>
      </div>
    </div>

    <div
      class="overflow-hidden rounded-2xl border shadow-sm"
      style="background-color: {dominant.hex}; color: {dominantText}"
      aria-label="Abstract website preview using 60-30-10 colors"
    >
      <header
        class="flex items-center justify-between gap-4 px-4 py-3 sm:px-5"
        style="background-color: {secondary.hex}; color: {secondaryText}"
      >
        <div class="flex items-center gap-3">
          <span
            class="size-7 rounded-lg"
            style="background-color: {accent.hex}"
            aria-hidden="true"
          ></span>
          <div class="space-y-1">
            <span class="block h-2 w-20 rounded-full opacity-90" style="background-color: currentColor"></span>
            <span class="block h-1.5 w-12 rounded-full opacity-50" style="background-color: currentColor"></span>
          </div>
        </div>
        <nav class="hidden items-center gap-3 sm:flex" aria-hidden="true">
          <span class="h-1.5 w-10 rounded-full opacity-70" style="background-color: currentColor"></span>
          <span class="h-1.5 w-8 rounded-full opacity-50" style="background-color: currentColor"></span>
          <span class="h-1.5 w-12 rounded-full opacity-50" style="background-color: currentColor"></span>
          <span
            class="rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-wide uppercase"
            style="background-color: {accent.hex}; color: {accentText}"
          >
            Action
          </span>
        </nav>
      </header>

      <div class="grid gap-4 p-4 sm:grid-cols-[1fr_14rem] sm:p-5">
        <div class="space-y-4">
          <div class="space-y-2">
            <span class="block h-3 w-3/4 max-w-xs rounded-full opacity-80" style="background-color: {secondary.hex}"></span>
            <span class="block h-2 w-full max-w-md rounded-full opacity-35" style="background-color: {secondary.hex}"></span>
            <span class="block h-2 w-5/6 max-w-sm rounded-full opacity-25" style="background-color: {secondary.hex}"></span>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            {#each [1, 2] as card}
              <article
                class="rounded-xl p-3 shadow-sm"
                style="background-color: {secondary.hex}; color: {secondaryText}"
              >
                <div class="mb-3 flex items-center justify-between">
                  <span class="size-8 rounded-lg opacity-90" style="background-color: {accent.hex}"></span>
                  <span class="text-[10px] font-semibold tracking-wide uppercase opacity-70">Card {card}</span>
                </div>
                <span class="mb-2 block h-2 w-24 rounded-full opacity-80" style="background-color: currentColor"></span>
                <span class="mb-1 block h-1.5 w-full rounded-full opacity-40" style="background-color: currentColor"></span>
                <span class="block h-1.5 w-4/5 rounded-full opacity-30" style="background-color: currentColor"></span>
              </article>
            {/each}
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="rounded-full px-4 py-2 text-xs font-semibold tracking-wide uppercase"
              style="background-color: {accent.hex}; color: {accentText}"
              tabindex="-1"
            >
              Primary CTA
            </button>
            <button
              type="button"
              class="rounded-full border px-4 py-2 text-xs font-semibold tracking-wide uppercase"
              style="border-color: {secondary.hex}; color: {secondary.hex}"
              tabindex="-1"
            >
              Secondary
            </button>
          </div>
        </div>

        <aside
          class="rounded-xl p-3"
          style="background-color: {secondary.hex}; color: {secondaryText}"
        >
          <p class="mb-3 text-[10px] font-semibold tracking-wide uppercase opacity-70">Sidebar</p>
          <div class="space-y-2" aria-hidden="true">
            <span class="block h-1.5 w-full rounded-full opacity-70" style="background-color: currentColor"></span>
            <span class="block h-1.5 w-5/6 rounded-full opacity-45" style="background-color: currentColor"></span>
            <span class="block h-1.5 w-4/5 rounded-full opacity-35" style="background-color: currentColor"></span>
            <span class="mt-4 block h-16 rounded-lg" style="background-color: {accent.hex}"></span>
            <span class="block h-1.5 w-3/4 rounded-full opacity-40" style="background-color: currentColor"></span>
          </div>
        </aside>
      </div>

      <footer
        class="flex items-center justify-between gap-3 px-4 py-3 text-[10px] tracking-wide uppercase sm:px-5"
        style="background-color: {secondary.hex}; color: {secondaryText}"
      >
        <span class="opacity-70">Footer · 60% canvas</span>
        <span
          class="rounded-full px-2 py-1 font-semibold"
          style="background-color: {accent.hex}; color: {accentText}"
        >
          Accent
        </span>
      </footer>
    </div>
  </div>
{/if}
