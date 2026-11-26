<script lang="ts">
  import { Tabs } from 'bits-ui';
  import ContrastMatrix from './ContrastMatrix.svelte';
  import ShadeExplorer from './ShadeExplorer.svelte';
  import VisionSimulator from './VisionSimulator.svelte';

  const tabs = [
    { value: 'scale', label: 'Scale 50–950' },
    { value: 'contrast', label: 'Contrast' },
    { value: 'vision', label: 'Color vision' }
  ];
  let active = $state('scale');
</script>

<section class="panel p-5 sm:p-6" aria-labelledby="analysis-heading">
  <Tabs.Root bind:value={active}>
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 id="analysis-heading" class="font-display text-xl font-semibold">Inspect</h2>
      <div class="w-full sm:w-auto">
        <Tabs.List class="segmented flex w-full sm:inline-flex sm:w-auto [&>button]:flex-1 [&>button]:px-2 sm:[&>button]:px-3">
          {#each tabs as tab (tab.value)}
            <Tabs.Trigger value={tab.value}>{tab.label}</Tabs.Trigger>
          {/each}
        </Tabs.List>
      </div>
    </div>
    <Tabs.Content value="scale" class="outline-none"><ShadeExplorer /></Tabs.Content>
    <Tabs.Content value="contrast" class="outline-none"><ContrastMatrix /></Tabs.Content>
    <Tabs.Content value="vision" class="outline-none"><VisionSimulator /></Tabs.Content>
  </Tabs.Root>
</section>
