<script lang="ts">
  import { Tabs } from 'bits-ui';
  import { getPaletteStoreContext } from '$lib/stores/palette.svelte';
  import { deriveUiRoles, uiRoleStyle, type PreviewMode } from '$lib/color/roles';
  import { CVD_INFO, CVD_TYPES, cvdFilterValues, type CvdType } from '$lib/color/vision';
  import DashboardPreview from './DashboardPreview.svelte';
  import EditorialPreview from './EditorialPreview.svelte';
  import SpecimenPreview from './SpecimenPreview.svelte';
  import WebsitePreview from './WebsitePreview.svelte';
  import Moon from '@lucide/svelte/icons/moon';
  import Sun from '@lucide/svelte/icons/sun';

  const paletteStore = getPaletteStoreContext();
  const uid = $props.id();
  const filterPrefix = `cvd-${uid}`;

  const previews = [
    { value: 'website', label: 'Website' },
    { value: 'editorial', label: 'Editorial' },
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'specimen', label: 'Specimen' }
  ];

  let active = $state('website');
  let mode = $state<PreviewMode>('light');
  let vision = $state<CvdType | 'none'>('none');

  const roles = $derived(deriveUiRoles(paletteStore.colors, paletteStore.harmony, mode));
  const style = $derived(
    `${uiRoleStyle(roles)}; filter: ${vision === 'none' ? 'none' : `url(#${filterPrefix}-${vision})`}`
  );
</script>

<svg class="absolute size-0" aria-hidden="true" focusable="false">
  {#each CVD_TYPES as type (type)}
    <filter id="{filterPrefix}-{type}" color-interpolation-filters="linearRGB">
      <feColorMatrix type="matrix" values={cvdFilterValues(type)} />
    </filter>
  {/each}
</svg>

<section class="panel p-5 sm:p-6" aria-labelledby="preview-heading">
  <Tabs.Root bind:value={active}>
    <div class="mb-5 flex flex-wrap items-center gap-3">
      <h2 id="preview-heading" class="font-display mr-auto text-xl font-semibold">Preview</h2>
      <div class="w-full sm:w-auto">
        <Tabs.List class="segmented flex w-full sm:inline-flex sm:w-auto [&>button]:flex-1 [&>button]:px-2 sm:[&>button]:px-3">
          {#each previews as preview (preview.value)}
            <Tabs.Trigger value={preview.value}>{preview.label}</Tabs.Trigger>
          {/each}
        </Tabs.List>
      </div>
      <div class="segmented" role="group" aria-label="Preview theme">
        <button type="button" class="size-8 !px-0" aria-pressed={mode === 'light'} aria-label="Light preview" onclick={() => (mode = 'light')}>
          <Sun class="size-4" aria-hidden="true" />
        </button>
        <button type="button" class="size-8 !px-0" aria-pressed={mode === 'dark'} aria-label="Dark preview" onclick={() => (mode = 'dark')}>
          <Moon class="size-4" aria-hidden="true" />
        </button>
      </div>
      <label class="well flex h-10 items-center gap-2 rounded-xl pr-1 pl-3 text-sm">
        <span class="text-muted-foreground">Vision</span>
        <select
          bind:value={vision}
          class="bg-card h-8 rounded-lg border-0 px-2 text-sm font-medium shadow-[0_1px_2px_oklch(0_0_0/0.12)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="none">Typical</option>
          {#each CVD_TYPES as type (type)}
            <option value={type}>{CVD_INFO[type].name}</option>
          {/each}
        </select>
      </label>
    </div>

    <div class="transition-[filter] duration-300" {style}>
      <Tabs.Content value="website" class="outline-none"><WebsitePreview {roles} /></Tabs.Content>
      <Tabs.Content value="editorial" class="outline-none"><EditorialPreview {roles} /></Tabs.Content>
      <Tabs.Content value="dashboard" class="outline-none"><DashboardPreview {roles} /></Tabs.Content>
      <Tabs.Content value="specimen" class="outline-none"><SpecimenPreview {roles} /></Tabs.Content>
    </div>

    <p class="text-muted-foreground mt-3 text-xs">
      {#if paletteStore.harmony === '60-30-10'}
        Dominant fills the canvas, secondary carries structure, and the accent marks actions.
      {:else}
        Neutrals are tinted from your first color; palette colors take the primary, secondary, and
        accent roles.
      {/if}
      {#if vision !== 'none'}
        Simulating {CVD_INFO[vision].name.toLowerCase()}.
      {/if}
    </p>
  </Tabs.Root>
</section>
