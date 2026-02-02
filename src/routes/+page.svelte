<script lang="ts">
  import { ColorPicker, HarmonySelector, PaletteDisplay } from '$lib/components';
  import { paletteStore } from '$lib/stores/palette.svelte';
  import { getHarmonyName } from '$lib/color/harmonies';
</script>

<svelte:head>
  <title>Color Palette Generator</title>
  <meta name="description" content="Generate harmonious color palettes using color theory" />
</svelte:head>

<div class="app">
  <header>
    <h1>Color Palette Generator</h1>
    <p class="subtitle">Create harmonious palettes using color theory</p>
  </header>

  <main>
    <div class="controls">
      <ColorPicker />
      <HarmonySelector />
    </div>

    <div class="output">
      <PaletteDisplay />

      <div class="info-panel">
        <h3>About {getHarmonyName(paletteStore.harmony)}</h3>
        {#if paletteStore.harmony === 'complementary'}
          <p>Complementary colors sit opposite each other on the color wheel. This creates high contrast and visual tension, making it great for creating impact.</p>
        {:else if paletteStore.harmony === 'analogous'}
          <p>Analogous colors are neighbors on the color wheel. They create harmonious, cohesive designs that are pleasing to the eye and often found in nature.</p>
        {:else if paletteStore.harmony === 'triadic'}
          <p>Triadic colors are evenly spaced around the color wheel (120° apart). This creates vibrant palettes with strong visual contrast while maintaining balance.</p>
        {:else if paletteStore.harmony === 'split-complementary'}
          <p>Split-complementary uses a base color plus the two colors adjacent to its complement. It offers contrast similar to complementary but with less tension.</p>
        {:else if paletteStore.harmony === 'tetradic'}
          <p>Tetradic (or rectangular) harmony uses four colors arranged in two complementary pairs. It offers rich color variety but requires careful balance.</p>
        {:else if paletteStore.harmony === 'monochromatic'}
          <p>Monochromatic palettes use a single hue with variations in saturation and lightness. They create cohesive, elegant designs with subtle depth.</p>
        {/if}
      </div>
    </div>
  </main>

  <footer>
    <p>Click any color swatch to copy its HEX value</p>
  </footer>
</div>

<style>
  .app {
    min-height: 100vh;
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 24px;
    display: flex;
    flex-direction: column;
  }

  header {
    text-align: center;
    margin-bottom: 40px;
  }

  h1 {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    margin: 8px 0 0;
    color: var(--text-secondary);
    font-size: 16px;
  }

  main {
    flex: 1;
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 24px;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .output {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .info-panel {
    background: var(--bg-surface);
    border-radius: 12px;
    padding: 20px;
  }

  .info-panel h3 {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
  }

  .info-panel p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.6;
  }

  footer {
    margin-top: 40px;
    text-align: center;
  }

  footer p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 13px;
  }

  @media (max-width: 768px) {
    main {
      grid-template-columns: 1fr;
    }

    .controls {
      order: 2;
    }

    .output {
      order: 1;
    }
  }
</style>
