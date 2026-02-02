<script lang="ts">
  import { paletteStore } from '$lib/stores/palette.svelte';
  import { hexToHsl } from '$lib/color/conversions';

  let hexInput = $state(paletteStore.baseColor.hex);
  let hexError = $state(false);

  function handleHexChange(e: Event) {
    const input = e.target as HTMLInputElement;
    let value = input.value;

    if (!value.startsWith('#')) {
      value = '#' + value;
    }

    hexInput = value;

    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      const hsl = hexToHsl(value);
      if (hsl) {
        paletteStore.setHsl(hsl);
        hexError = false;
      }
    } else if (value.length > 1) {
      hexError = true;
    }
  }

  $effect(() => {
    hexInput = paletteStore.baseColor.hex;
    hexError = false;
  });
</script>

<div class="color-picker">
  <div class="preview-section">
    <div
      class="color-preview"
      style="background-color: {paletteStore.baseColor.hex}"
    ></div>
    <div class="hex-input-wrapper">
      <input
        type="text"
        value={hexInput}
        oninput={handleHexChange}
        class="hex-input"
        class:error={hexError}
        maxlength="7"
        spellcheck="false"
      />
    </div>
  </div>

  <div class="sliders">
    <div class="slider-group">
      <label>
        <span class="slider-label">H</span>
        <input
          type="range"
          min="0"
          max="360"
          value={paletteStore.hue}
          oninput={(e) => paletteStore.setHue(Number((e.target as HTMLInputElement).value))}
          class="hue-slider"
          style="background: linear-gradient(to right,
            hsl(0, 70%, 50%),
            hsl(60, 70%, 50%),
            hsl(120, 70%, 50%),
            hsl(180, 70%, 50%),
            hsl(240, 70%, 50%),
            hsl(300, 70%, 50%),
            hsl(360, 70%, 50%))"
        />
        <span class="slider-value">{paletteStore.hue}°</span>
      </label>
    </div>

    <div class="slider-group">
      <label>
        <span class="slider-label">S</span>
        <input
          type="range"
          min="0"
          max="100"
          value={paletteStore.saturation}
          oninput={(e) => paletteStore.setSaturation(Number((e.target as HTMLInputElement).value))}
          style="background: linear-gradient(to right,
            hsl({paletteStore.hue}, 0%, {paletteStore.lightness}%),
            hsl({paletteStore.hue}, 100%, {paletteStore.lightness}%))"
        />
        <span class="slider-value">{paletteStore.saturation}%</span>
      </label>
    </div>

    <div class="slider-group">
      <label>
        <span class="slider-label">L</span>
        <input
          type="range"
          min="0"
          max="100"
          value={paletteStore.lightness}
          oninput={(e) => paletteStore.setLightness(Number((e.target as HTMLInputElement).value))}
          style="background: linear-gradient(to right,
            hsl({paletteStore.hue}, {paletteStore.saturation}%, 0%),
            hsl({paletteStore.hue}, {paletteStore.saturation}%, 50%),
            hsl({paletteStore.hue}, {paletteStore.saturation}%, 100%))"
        />
        <span class="slider-value">{paletteStore.lightness}%</span>
      </label>
    </div>
  </div>

  <button class="randomize-btn" onclick={() => paletteStore.randomize()}>
    Randomize
  </button>
</div>

<style>
  .color-picker {
    background: var(--bg-surface);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .preview-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .color-preview {
    width: 120px;
    height: 120px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: background-color 0.15s ease;
  }

  .hex-input-wrapper {
    width: 100%;
  }

  .hex-input {
    width: 100%;
    background: var(--bg-elevated);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 8px 12px;
    color: var(--text-primary);
    font-family: monospace;
    font-size: 16px;
    text-align: center;
    text-transform: uppercase;
  }

  .hex-input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .hex-input.error {
    border-color: #ef4444;
  }

  .sliders {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .slider-group label {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .slider-label {
    width: 16px;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .slider-group input[type="range"] {
    flex: 1;
  }

  .slider-value {
    width: 48px;
    text-align: right;
    font-family: monospace;
    font-size: 14px;
    color: var(--text-secondary);
  }

  .randomize-btn {
    background: var(--bg-elevated);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 10px 16px;
    color: var(--text-primary);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .randomize-btn:hover {
    background: var(--border-color);
  }
</style>
