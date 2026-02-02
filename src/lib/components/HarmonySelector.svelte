<script lang="ts">
  import type { HarmonyType } from '$lib/types';
  import { paletteStore } from '$lib/stores/palette.svelte';
  import { getHarmonyName, getHarmonyDescription } from '$lib/color/harmonies';

  const harmonies: HarmonyType[] = [
    'complementary',
    'analogous',
    'triadic',
    'split-complementary',
    'tetradic',
    'monochromatic'
  ];
</script>

<div class="harmony-selector">
  <h3>Harmony Type</h3>
  <div class="harmony-options">
    {#each harmonies as harmony}
      <button
        class="harmony-option"
        class:selected={paletteStore.harmony === harmony}
        onclick={() => paletteStore.setHarmony(harmony)}
        title={getHarmonyDescription(harmony)}
      >
        <span class="harmony-name">{getHarmonyName(harmony)}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .harmony-selector {
    background: var(--bg-surface);
    border-radius: 12px;
    padding: 20px;
  }

  h3 {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .harmony-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .harmony-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .harmony-option:hover {
    background: var(--border-color);
  }

  .harmony-option.selected {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }

  .harmony-name {
    color: var(--text-primary);
    font-size: 14px;
  }
</style>
