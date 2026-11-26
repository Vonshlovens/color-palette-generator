<script lang="ts">
  import { PaletteWorkspace } from '$lib/components';
  import { getStudioStoresContext } from '$lib/stores/palette.svelte';

  const { studio } = getStudioStoresContext();

  const shortcuts = [
    { keys: ['Space'], action: 'shuffle' },
    { keys: ['L'], action: 'lock' },
    { keys: ['1', '5'], action: 'pick a swatch' },
    { keys: ['⌘', 'Z'], action: 'undo' }
  ];
</script>

<svelte:head>
  <title>Palette Studio</title>
  <meta
    name="description"
    content="Build accessible color palettes with harmony rules, OKLCH scales, contrast checks, and live UI previews."
  />
</svelte:head>

<main class="mx-auto max-w-[90rem] px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
  <div class="mb-9 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
    <h1 class="font-display max-w-2xl text-4xl leading-[0.98] font-semibold text-balance sm:text-6xl">
      Find colors that belong together.
    </h1>
    <ul class="text-muted-foreground hidden flex-wrap gap-x-4 gap-y-2 text-xs md:flex md:justify-end" aria-label="Keyboard shortcuts">
      {#each shortcuts as shortcut (shortcut.action)}
        <li class="flex items-center gap-1.5">
          <span class="flex items-center gap-0.5">
            {#each shortcut.keys as key, index (key)}
              {#if index > 0 && shortcut.keys.length === 2 && key === '5'}<span>–</span>{/if}
              <kbd class="kbd">{key}</kbd>
            {/each}
          </span>
          {shortcut.action}
        </li>
      {/each}
    </ul>
  </div>

  <PaletteWorkspace store={studio} />
</main>
