import type { HSL, Color, HarmonyType, PaletteState } from '$lib/types';
import { createColor } from '$lib/color/conversions';
import { generatePalette } from '$lib/color/harmonies';

const DEFAULT_STATE: PaletteState = {
  hue: 220,
  saturation: 70,
  lightness: 50,
  harmony: 'complementary'
};

class PaletteStore {
  #state = $state<PaletteState>(DEFAULT_STATE);

  get hue(): number {
    return this.#state.hue;
  }

  get saturation(): number {
    return this.#state.saturation;
  }

  get lightness(): number {
    return this.#state.lightness;
  }

  get harmony(): HarmonyType {
    return this.#state.harmony;
  }

  get baseHsl(): HSL {
    return {
      h: this.#state.hue,
      s: this.#state.saturation,
      l: this.#state.lightness
    };
  }

  get baseColor(): Color {
    return createColor(this.baseHsl);
  }

  get colors(): Color[] {
    return generatePalette(this.baseHsl, this.#state.harmony);
  }

  setHue(value: number): void {
    this.#state.hue = Math.max(0, Math.min(360, value));
  }

  setSaturation(value: number): void {
    this.#state.saturation = Math.max(0, Math.min(100, value));
  }

  setLightness(value: number): void {
    this.#state.lightness = Math.max(0, Math.min(100, value));
  }

  setHarmony(value: HarmonyType): void {
    this.#state.harmony = value;
  }

  setHsl(hsl: HSL): void {
    this.#state.hue = hsl.h;
    this.#state.saturation = hsl.s;
    this.#state.lightness = hsl.l;
  }

  randomize(): void {
    this.#state.hue = Math.floor(Math.random() * 360);
    this.#state.saturation = 50 + Math.floor(Math.random() * 40);
    this.#state.lightness = 40 + Math.floor(Math.random() * 30);
  }
}

export const paletteStore = new PaletteStore();
