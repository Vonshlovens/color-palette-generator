<script lang="ts">
  import { getPaletteStoreContext } from '$lib/stores/palette.svelte';
  import { hexToHsl, rgbToHsl } from '$lib/color/conversions';
  import { getSwatchLabel } from '$lib/color/harmonies';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';

  const paletteStore = getPaletteStoreContext();
  let hexInput = $state(paletteStore.selectedColor.hex);
  let hexError = $state(false);
  let rgbInput = $state<Record<'r' | 'g' | 'b', number | string>>({
    ...paletteStore.selectedColor.rgb
  });
  let rgbErrors = $state<Record<'r' | 'g' | 'b', boolean>>({ r: false, g: false, b: false });

  const selectedLabel = $derived(
    getSwatchLabel(paletteStore.harmony, paletteStore.selectedIndex)
  );
  const selectedHsl = $derived(paletteStore.selectedColor.hsl);
  const hasRgbError = $derived(Object.values(rgbErrors).some(Boolean));

  function formatHslChannel(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

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
        paletteStore.setSelectedHsl(hsl);
        hexError = false;
      }
    } else if (value.length > 1) {
      hexError = true;
    }
  }

  function handleRgbChange(channel: 'r' | 'g' | 'b', e: Event) {
    const input = e.target as HTMLInputElement;
    const value = input.value;
    const channelValue = Number(value);

    rgbInput[channel] = value === '' ? '' : value;

    if (
      value === '' ||
      !Number.isInteger(channelValue) ||
      channelValue < 0 ||
      channelValue > 255
    ) {
      rgbErrors[channel] = true;
      return;
    }

    paletteStore.setSelectedHsl(
      rgbToHsl({ ...paletteStore.selectedColor.rgb, [channel]: channelValue })
    );
    rgbErrors[channel] = false;
  }

  $effect(() => {
    hexInput = paletteStore.selectedColor.hex;
    hexError = false;
    rgbInput = { ...paletteStore.selectedColor.rgb };
    rgbErrors = { r: false, g: false, b: false };
  });
</script>

<Card.Root>
  <Card.Header class="border-b">
    <Card.Title>Edit {selectedLabel}</Card.Title>
    <Card.Description>
      Click a swatch to select it, then adjust HSL or enter a HEX or RGB value. Lock other swatches
      to keep them fixed.
    </Card.Description>
  </Card.Header>

  <Card.Content class="space-y-6">
    <div class="flex items-center gap-4">
      <div
        class="size-20 shrink-0 rounded-xl border shadow-sm transition-colors sm:size-24"
        style="background-color: {paletteStore.selectedColor.hex}"
        role="img"
        aria-label="Selected swatch preview: {paletteStore.selectedColor.hex}"
      ></div>
      <div class="min-w-0 flex-1 space-y-2">
        <Label for="selected-color-hex">HEX value</Label>
        <Input
          id="selected-color-hex"
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

    <fieldset class="space-y-2">
      <legend class="text-sm font-medium">RGB values</legend>
      <div class="grid grid-cols-3 gap-2">
        <div class="space-y-1">
          <Label for="selected-color-red" class="text-muted-foreground text-xs">Red</Label>
          <Input
            id="selected-color-red"
            type="number"
            min="0"
            max="255"
            step="1"
            inputmode="numeric"
            value={rgbInput.r}
            oninput={(e) => handleRgbChange('r', e)}
            class={`font-mono ${rgbErrors.r ? 'border-destructive' : ''}`}
            aria-invalid={rgbErrors.r}
            aria-describedby={rgbErrors.r ? 'rgb-error' : undefined}
          />
        </div>
        <div class="space-y-1">
          <Label for="selected-color-green" class="text-muted-foreground text-xs">Green</Label>
          <Input
            id="selected-color-green"
            type="number"
            min="0"
            max="255"
            step="1"
            inputmode="numeric"
            value={rgbInput.g}
            oninput={(e) => handleRgbChange('g', e)}
            class={`font-mono ${rgbErrors.g ? 'border-destructive' : ''}`}
            aria-invalid={rgbErrors.g}
            aria-describedby={rgbErrors.g ? 'rgb-error' : undefined}
          />
        </div>
        <div class="space-y-1">
          <Label for="selected-color-blue" class="text-muted-foreground text-xs">Blue</Label>
          <Input
            id="selected-color-blue"
            type="number"
            min="0"
            max="255"
            step="1"
            inputmode="numeric"
            value={rgbInput.b}
            oninput={(e) => handleRgbChange('b', e)}
            class={`font-mono ${rgbErrors.b ? 'border-destructive' : ''}`}
            aria-invalid={rgbErrors.b}
            aria-describedby={rgbErrors.b ? 'rgb-error' : undefined}
          />
        </div>
      </div>
      {#if hasRgbError}
        <p id="rgb-error" class="text-destructive text-xs">Enter whole RGB values from 0 to 255.</p>
      {/if}
    </fieldset>

    <div class="space-y-5">
      <div class="grid grid-cols-[1.5rem_1fr_3rem] items-center gap-3">
        <Label for="hue" class="text-muted-foreground">H</Label>
        <input
          id="hue"
          type="range"
          min="0"
          max="360"
          value={selectedHsl.h}
          oninput={(e) => paletteStore.setSelectedHue(Number((e.target as HTMLInputElement).value))}
          aria-label="Hue for {selectedLabel}"
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
          {formatHslChannel(selectedHsl.h)}°
        </output>
      </div>

      <div class="grid grid-cols-[1.5rem_1fr_3rem] items-center gap-3">
        <Label for="saturation" class="text-muted-foreground">S</Label>
        <input
          id="saturation"
          type="range"
          min="0"
          max="100"
          value={selectedHsl.s}
          oninput={(e) =>
            paletteStore.setSelectedSaturation(Number((e.target as HTMLInputElement).value))}
          aria-label="Saturation for {selectedLabel}"
          class="w-full"
          style="background: linear-gradient(to right,
            hsl({selectedHsl.h}, 0%, {selectedHsl.l}%),
            hsl({selectedHsl.h}, 100%, {selectedHsl.l}%))"
        />
        <output for="saturation" class="text-muted-foreground text-right font-mono text-xs">
          {formatHslChannel(selectedHsl.s)}%
        </output>
      </div>

      <div class="grid grid-cols-[1.5rem_1fr_3rem] items-center gap-3">
        <Label for="lightness" class="text-muted-foreground">L</Label>
        <input
          id="lightness"
          type="range"
          min="0"
          max="100"
          value={selectedHsl.l}
          oninput={(e) =>
            paletteStore.setSelectedLightness(Number((e.target as HTMLInputElement).value))}
          aria-label="Lightness for {selectedLabel}"
          class="w-full"
          style="background: linear-gradient(to right,
            hsl({selectedHsl.h}, {selectedHsl.s}%, 0%),
            hsl({selectedHsl.h}, {selectedHsl.s}%, 50%),
            hsl({selectedHsl.h}, {selectedHsl.s}%, 100%))"
        />
        <output for="lightness" class="text-muted-foreground text-right font-mono text-xs">
          {formatHslChannel(selectedHsl.l)}%
        </output>
      </div>
    </div>

    <Button variant="outline" class="w-full" onclick={() => paletteStore.randomize()}>
      <RefreshCw data-icon="inline-start" />
      Randomize palette
    </Button>
    <p class="text-muted-foreground text-xs">
      Randomize picks a new seed color; locked swatches stay put. Unlocked siblings follow the
      harmony unless you lock them.
    </p>
  </Card.Content>
</Card.Root>
