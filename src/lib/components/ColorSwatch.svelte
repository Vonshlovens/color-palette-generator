<script lang="ts">
  import type { Color } from '$lib/types';
  import { getContrastTextColor } from '$lib/color/conversions';

  interface Props {
    color: Color;
    index: number;
  }

  let { color, index }: Props = $props();

  let copied = $state(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(color.hex);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  const textColor = $derived(getContrastTextColor(color.rgb));
</script>

<button
  class="swatch"
  style="background-color: {color.hex}"
  onclick={copyToClipboard}
  title="Click to copy {color.hex}"
>
  <div class="swatch-content" class:dark={textColor === 'dark'}>
    <span class="color-index">{index + 1}</span>
    <span class="color-hex">{copied ? 'Copied!' : color.hex}</span>
  </div>
</button>

<style>
  .swatch {
    flex: 1;
    min-height: 140px;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    position: relative;
    overflow: hidden;
  }

  .swatch:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }

  .swatch:active {
    transform: translateY(-2px);
  }

  .swatch-content {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: white;
  }

  .swatch-content.dark {
    color: #1a1a1a;
  }

  .color-index {
    font-size: 12px;
    opacity: 0.7;
  }

  .color-hex {
    font-family: monospace;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
  }
</style>
