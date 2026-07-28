import {
  HARMONY_TYPES,
  type HSL,
  type Color,
  type HarmonyType,
  type PaletteSnapshot,
  type PaletteState
} from '$lib/types';
import { createColor } from '$lib/color/conversions';
import { generatePalette } from '$lib/color/harmonies';
import { getContext, hasContext, setContext } from 'svelte';

const DEFAULT_STATE: PaletteState = {
  hue: 220,
  saturation: 70,
  lightness: 50,
  harmony: 'complementary'
};

const PALETTE_STORE_CONTEXT = Symbol('palette-store');

function cloneColor(color: Color): Color {
  return createColor({ ...color.hsl });
}

export class PaletteStore {
  #state = $state<PaletteState>({ ...DEFAULT_STATE });
  /** Locked palette slots keyed by index; locked colors stay fixed while the base changes. */
  #locks = $state<Record<number, Color>>({});

  constructor(snapshot?: PaletteSnapshot) {
    if (snapshot) this.hydrate(snapshot);
  }

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

  get locks(): Readonly<Record<number, Color>> {
    return this.#locks;
  }

  get lockedCount(): number {
    return Object.keys(this.#locks).length;
  }

  get colors(): Color[] {
    const generated = generatePalette(this.baseHsl, this.#state.harmony);
    return generated.map((color, index) =>
      this.#locks[index] ? cloneColor(this.#locks[index]) : color
    );
  }

  isLocked(index: number): boolean {
    return this.#locks[index] !== undefined;
  }

  toggleLock(index: number): void {
    if (!Number.isInteger(index) || index < 0) return;

    if (this.isLocked(index)) {
      const { [index]: _removed, ...rest } = this.#locks;
      this.#locks = rest;
      return;
    }

    const generated = generatePalette(this.baseHsl, this.#state.harmony);
    if (index >= generated.length) return;

    // Lock the currently displayed color (respecting any existing locks).
    const current = this.colors[index];
    this.#locks = { ...this.#locks, [index]: cloneColor(current) };
  }

  clearLocks(): void {
    this.#locks = {};
  }

  setHue(value: number): void {
    if (Number.isFinite(value)) this.#state.hue = Math.max(0, Math.min(360, value));
  }

  setSaturation(value: number): void {
    if (Number.isFinite(value)) this.#state.saturation = Math.max(0, Math.min(100, value));
  }

  setLightness(value: number): void {
    if (Number.isFinite(value)) this.#state.lightness = Math.max(0, Math.min(100, value));
  }

  setHarmony(value: HarmonyType): void {
    this.#state.harmony = value;
    // Drop locks when the relationship changes so a previous mode can't freeze the new palette.
    this.clearLocks();
  }

  setHsl(hsl: HSL): void {
    this.setHue(hsl.h);
    this.setSaturation(hsl.s);
    this.setLightness(hsl.l);
  }

  snapshot(): PaletteSnapshot {
    return Object.freeze({
      hue: this.#state.hue,
      saturation: this.#state.saturation,
      lightness: this.#state.lightness,
      harmony: this.#state.harmony
    });
  }

  hydrate(snapshot: PaletteSnapshot): boolean {
    if (
      !Number.isFinite(snapshot.hue) ||
      snapshot.hue < 0 ||
      snapshot.hue > 360 ||
      !Number.isFinite(snapshot.saturation) ||
      snapshot.saturation < 0 ||
      snapshot.saturation > 100 ||
      !Number.isFinite(snapshot.lightness) ||
      snapshot.lightness < 0 ||
      snapshot.lightness > 100 ||
      !HARMONY_TYPES.includes(snapshot.harmony)
    ) {
      return false;
    }

    this.#state = { ...snapshot };
    this.clearLocks();
    return true;
  }

  /** Randomize the base HSL only; locked palette slots stay put. */
  randomize(): void {
    this.#state.hue = Math.floor(Math.random() * 360);
    this.#state.saturation = 50 + Math.floor(Math.random() * 40);
    this.#state.lightness = 40 + Math.floor(Math.random() * 30);
  }
}

export function createPaletteStore(snapshot?: PaletteSnapshot): PaletteStore {
  return new PaletteStore(snapshot);
}

export function setPaletteStoreContext(snapshot?: PaletteSnapshot): void {
  setContext(PALETTE_STORE_CONTEXT, createPaletteStore(snapshot));
}

export function getPaletteStoreContext(): PaletteStore {
  if (!hasContext(PALETTE_STORE_CONTEXT)) {
    throw new Error('Palette store context is only available inside PaletteWorkspace');
  }

  return getContext<PaletteStore>(PALETTE_STORE_CONTEXT);
}
