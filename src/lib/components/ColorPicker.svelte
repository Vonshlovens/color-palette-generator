<script lang="ts">
  import { paletteStore } from '$lib/stores/palette.svelte';
  import { hexToHsl } from '$lib/color/conversions';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';

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

<Card.Root>
  <Card.Header class="border-b">
    <Card.Title>Base color</Card.Title>
    <Card.Description>Adjust the HSL channels or enter a HEX value.</Card.Description>
  </Card.Header>

  <Card.Content class="space-y-6">
    <div class="flex items-center gap-4">
    <div
        class="size-20 shrink-0 rounded-xl border shadow-sm transition-colors sm:size-24"
      style="background-color: {paletteStore.baseColor.hex}"
        role="img"
        aria-label="Selected color preview: {paletteStore.baseColor.hex}"
      ></div>
      <div class="min-w-0 flex-1 space-y-2">
        <Label for="base-color-hex">HEX value</Label>
        <Input
          id="base-color-hex"
        type="text"
        value={hexInput}
        oninput={handleHexChange}
          class={`font-mono uppercase ${hexError ? 'border-destructive' : ''}`}
          maxlength={7}
          spellcheck="false"
          aria-invalid={hexError}
          aria-describedby={hexError ? 'hex-error' : undefined}
      />
        {#if hexError}
          <p id="hex-error" class="text-destructive text-xs">Enter a six-digit HEX value.</p>
        {/if}
    </div>
  </div>

    <div class="space-y-5">
      <div class="grid grid-cols-[1.5rem_1fr_3rem] items-center gap-3">
        <Label for="hue" class="text-muted-foreground">H</Label>
        <input
          id="hue"
          type="range"
          min="0"
          max="360"
          value={paletteStore.hue}
          oninput={(e) => paletteStore.setHue(Number((e.target as HTMLInputElement).value))}
          aria-label="Hue"
          class="w-full"
          style="background: linear-gradient(to right,
            hsl(0, 70%, 50%),
            hsl(60, 70%, 50%),
            hsl(120, 70%, 50%),
            hsl(180, 70%, 50%),
            hsl(240, 70%, 50%),
            hsl(300, 70%, 50%),
            hsl(360, 70%, 50%))"
        />
        <output for="hue" class="text-muted-foreground text-right font-mono text-xs">
          {paletteStore.hue}°
        </output>
    </div>

      <div class="grid grid-cols-[1.5rem_1fr_3rem] items-center gap-3">
        <Label for="saturation" class="text-muted-foreground">S</Label>
        <input
          id="saturation"
          type="range"
          min="0"
          max="100"
          value={paletteStore.saturation}
          oninput={(e) => paletteStore.setSaturation(Number((e.target as HTMLInputElement).value))}
          aria-label="Saturation"
          class="w-full"
          style="background: linear-gradient(to right,
            hsl({paletteStore.hue}, 0%, {paletteStore.lightness}%),
            hsl({paletteStore.hue}, 100%, {paletteStore.lightness}%))"
        />
        <output for="saturation" class="text-muted-foreground text-right font-mono text-xs">
          {paletteStore.saturation}%
        </output>
    </div>

      <div class="grid grid-cols-[1.5rem_1fr_3rem] items-center gap-3">
        <Label for="lightness" class="text-muted-foreground">L</Label>
        <input
          id="lightness"
          type="range"
          min="0"
          max="100"
          value={paletteStore.lightness}
          oninput={(e) => paletteStore.setLightness(Number((e.target as HTMLInputElement).value))}
          aria-label="Lightness"
          class="w-full"
          style="background: linear-gradient(to right,
            hsl({paletteStore.hue}, {paletteStore.saturation}%, 0%),
            hsl({paletteStore.hue}, {paletteStore.saturation}%, 50%),
            hsl({paletteStore.hue}, {paletteStore.saturation}%, 100%))"
        />
        <output for="lightness" class="text-muted-foreground text-right font-mono text-xs">
          {paletteStore.lightness}%
        </output>
      </div>
    </div>

    <Button variant="outline" class="w-full" onclick={() => paletteStore.randomize()}>
      <RefreshCw data-icon="inline-start" />
      Randomize color
    </Button>
  </Card.Content>
</Card.Root>
