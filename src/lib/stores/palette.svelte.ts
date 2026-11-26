import {
  HARMONY_TYPES,
  type HSL,
  type Color,
  type HarmonyType,
  type PaletteSnapshot,
  type PaletteState
} from '$lib/types';
import { clamp, createColor, hslEqual, isValidHsl } from '$lib/color/conversions';
import { generatePalette, inferBaseFromSwatch } from '$lib/color/harmonies';
import { getContext, hasContext, setContext } from 'svelte';
import { createFreeformStore, FreeformStore } from './freeform.svelte';
import { EditHistory } from './history.svelte';

const DEFAULT_STATE: PaletteState = {
  hue: 220,
  saturation: 70,
  lightness: 50,
  harmony: 'complementary'
};

const PALETTE_STORE_CONTEXT = Symbol('palette-store');
const STUDIO_STORES_CONTEXT = Symbol('studio-stores');

interface HistoryEntry {
  state: PaletteState;
  locks: Record<number, Color>;
  selectedIndex: number;
}

function cloneColor(color: Color): Color {
  return createColor({ ...color.hsl });
}

function clampHsl(hsl: HSL): HSL {
  return { h: clamp(hsl.h, 0, 360), s: clamp(hsl.s, 0, 100), l: clamp(hsl.l, 0, 100) };
}

export class PaletteStore {
  #state = $state<PaletteState>({ ...DEFAULT_STATE });
  /** Locked palette slots keyed by index; locked colors stay fixed while the base changes. */
  #locks = $state<Record<number, Color>>({});
  /** Which palette swatch the color picker is editing. */
  #selectedIndex = $state(0);
  #history = new EditHistory<HistoryEntry>(
    () => this.#capture(),
    (entry) => this.#restore(entry)
  );

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

  get selectedIndex(): number {
    return this.#selectedIndex;
  }

  /** The swatches on screen: the generated palette with locked slots pinned. */
  get colors(): Color[] {
    const generated = generatePalette(this.baseHsl, this.#state.harmony);
    return generated.map((color, index) =>
      this.#locks[index] ? cloneColor(this.#locks[index]) : color
    );
  }

  get selectedColor(): Color {
    const colors = this.colors;
    return colors[this.#selectedIndex] ?? colors[0] ?? this.baseColor;
  }

  get canUndo(): boolean {
    return this.#history.canUndo;
  }

  get canRedo(): boolean {
    return this.#history.canRedo;
  }

  #capture(): HistoryEntry {
    return {
      state: { ...this.#state },
      locks: { ...this.#locks },
      selectedIndex: this.#selectedIndex
    };
  }

  #restore(entry: HistoryEntry): void {
    this.#state = { ...entry.state };
    this.#locks = { ...entry.locks };
    this.#selectedIndex = entry.selectedIndex;
  }

  undo(): void {
    this.#history.undo();
  }

  redo(): void {
    this.#history.redo();
  }

  isLocked(index: number): boolean {
    return this.#locks[index] !== undefined;
  }

  selectColor(index: number): void {
    if (!Number.isInteger(index) || index < 0) return;
    if (index >= this.colors.length) return;
    this.#selectedIndex = index;
  }

  /**
   * Edit the selected swatch. Unlocked slots retarget the canonical base via the harmony
   * inverse so siblings can follow; locked slots are updated in place.
   */
  setSelectedHsl(hsl: HSL): void {
    const index = this.#selectedIndex;
    if (index < 0 || index >= generatePalette(this.baseHsl, this.#state.harmony).length) return;
    const next = createColor(clampHsl(hsl));
    const current = this.colors[index]?.hsl;
    if (current && hslEqual(current, next.hsl)) return;
    this.#history.record(`edit:${index}`);

    if (this.isLocked(index)) {
      this.#locks = { ...this.#locks, [index]: next };
      return;
    }

    const inferred = inferBaseFromSwatch(this.#state.harmony, index, next.hsl);
    this.#state.hue = inferred.h;
    this.#state.saturation = inferred.s;
    this.#state.lightness = inferred.l;

    // Pin exact channel values when the forward harmony can't reproduce them (e.g. mono S/L).
    const generated = generatePalette(this.baseHsl, this.#state.harmony)[index];
    if (generated && generated.hex !== next.hex) {
      this.#locks = { ...this.#locks, [index]: next };
    }
  }

  setSelectedHue(value: number): void {
    if (!Number.isFinite(value)) return;
    this.setSelectedHsl({ ...this.selectedColor.hsl, h: value });
  }

  setSelectedSaturation(value: number): void {
    if (!Number.isFinite(value)) return;
    this.setSelectedHsl({ ...this.selectedColor.hsl, s: value });
  }

  setSelectedLightness(value: number): void {
    if (!Number.isFinite(value)) return;
    this.setSelectedHsl({ ...this.selectedColor.hsl, l: value });
  }

  toggleLock(index: number): void {
    if (!Number.isInteger(index) || index < 0) return;
    if (index >= this.colors.length) return;
    this.#history.record();

    if (this.isLocked(index)) {
      const { [index]: _removed, ...rest } = this.#locks;
      this.#locks = rest;
      return;
    }

    // Lock the currently displayed color (respecting any existing locks).
    const current = this.colors[index];
    this.#locks = { ...this.#locks, [index]: cloneColor(current) };
  }

  clearLocks(): void {
    if (this.lockedCount > 0) this.#history.record();
    this.#locks = {};
  }

  setHue(value: number): void {
    if (!Number.isFinite(value)) return;
    this.#history.record('base');
    this.#state.hue = clamp(value, 0, 360);
  }

  setSaturation(value: number): void {
    if (!Number.isFinite(value)) return;
    this.#history.record('base');
    this.#state.saturation = clamp(value, 0, 100);
  }

  setLightness(value: number): void {
    if (!Number.isFinite(value)) return;
    this.#history.record('base');
    this.#state.lightness = clamp(value, 0, 100);
  }

  setHarmony(value: HarmonyType): void {
    if (value === this.#state.harmony) return;
    this.#history.record();
    this.#state.harmony = value;
    // Drop locks when the relationship changes so a previous mode can't freeze the new palette.
    this.#locks = {};
    this.#selectedIndex = 0;
  }

  setHsl(hsl: HSL): void {
    this.setHue(hsl.h);
    this.setSaturation(hsl.s);
    this.setLightness(hsl.l);
  }

  /**
   * The palette exactly as shown. `colors` are the on-screen swatches, which differ from the
   * generated ones wherever a slot is locked or pinned, so saving them (rather than only the
   * generator seed) is what keeps a saved palette identical to the screen.
   */
  snapshot(): PaletteSnapshot {
    return Object.freeze({
      hue: this.#state.hue,
      saturation: this.#state.saturation,
      lightness: this.#state.lightness,
      harmony: this.#state.harmony,
      colors: this.colors.map((color) => ({ ...color.hsl }))
    });
  }

  /**
   * Replace the palette with a snapshot. Without `colors` the generated swatches show and locks
   * clear; with them, every slot that differs from its generated color is locked so the exact
   * swatches come back.
   */
  hydrate(snapshot: PaletteSnapshot): boolean {
    const base = { h: snapshot.hue, s: snapshot.saturation, l: snapshot.lightness };
    if (!isValidHsl(base) || !HARMONY_TYPES.includes(snapshot.harmony)) return false;

    const generated = generatePalette(base, snapshot.harmony);
    const colors = snapshot.colors;
    if (colors && (colors.length !== generated.length || !colors.every(isValidHsl))) return false;

    const locks: Record<number, Color> = {};
    colors?.forEach((hsl, index) => {
      if (!hslEqual(hsl, generated[index].hsl)) {
        locks[index] = createColor({ h: hsl.h, s: hsl.s, l: hsl.l });
      }
    });

    this.#state = {
      hue: snapshot.hue,
      saturation: snapshot.saturation,
      lightness: snapshot.lightness,
      harmony: snapshot.harmony
    };
    this.#locks = locks;
    this.#selectedIndex = 0;
    return true;
  }

  /** Load a preset or other snapshot as an undoable edit. */
  load(snapshot: PaletteSnapshot): boolean {
    const before = this.#capture();
    if (!this.hydrate(snapshot)) return false;
    this.#history.push(before);
    return true;
  }

  /** Randomize the base HSL only; locked palette slots stay put. */
  randomize(): void {
    this.#history.record();
    this.#state.hue = Math.floor(Math.random() * 360);
    this.#state.saturation = 50 + Math.floor(Math.random() * 40);
    this.#state.lightness = 40 + Math.floor(Math.random() * 30);
  }
}

export function createPaletteStore(snapshot?: PaletteSnapshot): PaletteStore {
  return new PaletteStore(snapshot);
}

/** The store behind a workspace: the harmony studio or the freeform screen. */
export type StudioStore = PaletteStore | FreeformStore;

export function setPaletteStoreContext(store: StudioStore): void {
  setContext(PALETTE_STORE_CONTEXT, store);
}

export function getPaletteStoreContext(): StudioStore {
  if (!hasContext(PALETTE_STORE_CONTEXT)) {
    throw new Error('Palette store context is only available inside PaletteWorkspace');
  }
  return getContext<StudioStore>(PALETTE_STORE_CONTEXT);
}

/** For controls that only exist in the harmony studio, such as the harmony picker and presets. */
export function getHarmonyStoreContext(): PaletteStore {
  const store = getPaletteStoreContext();
  if (!(store instanceof PaletteStore)) {
    throw new Error('This control needs the harmony studio store');
  }
  return store;
}

export interface StudioStores {
  studio: PaletteStore;
  freeform: FreeformStore;
}

/**
 * Create the studio and freeform stores once for the app (in the root layout), so work in
 * either survives visits to the gallery and saved palettes.
 */
export function setStudioStoresContext(): StudioStores {
  return setContext<StudioStores>(STUDIO_STORES_CONTEXT, {
    studio: createPaletteStore(),
    freeform: createFreeformStore()
  });
}

export function getStudioStoresContext(): StudioStores {
  return getContext<StudioStores>(STUDIO_STORES_CONTEXT);
}

/**
 * Tint the page chrome with a palette while the calling component is mounted. The body
 * transitions these registered properties, so the ambient wash glides between palettes.
 */
export function tintPageWith(store: StudioStore): void {
  $effect(() => {
    const colors = store.colors;
    const style = document.body.style;
    style.setProperty('--studio-accent', store.selectedColor.hex);
    style.setProperty('--ambient-a', colors[0].hex);
    style.setProperty('--ambient-b', colors[colors.length - 1].hex);
  });

  $effect(() => () => {
    for (const property of ['--studio-accent', '--ambient-a', '--ambient-b']) {
      document.body.style.removeProperty(property);
    }
  });
}
