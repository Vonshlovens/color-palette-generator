import {
  HARMONY_TYPES,
  type HSL,
  type Color,
  type HarmonyType,
  type PaletteSnapshot,
  type PaletteState
} from '$lib/types';
import { createColor } from '$lib/color/conversions';
import { generatePalette, inferBaseFromSwatch } from '$lib/color/harmonies';
import { getContext, hasContext, setContext } from 'svelte';

const DEFAULT_STATE: PaletteState = {
  hue: 220,
  saturation: 70,
  lightness: 50,
  harmony: 'complementary'
};

const PALETTE_STORE_CONTEXT = Symbol('palette-store');
/** Edits with the same key inside this window collapse into one undo step (e.g. a slider drag). */
const COALESCE_MS = 700;
const HISTORY_LIMIT = 100;

interface HistoryEntry {
  state: PaletteState;
  locks: Record<number, Color>;
  selectedIndex: number;
}

function cloneColor(color: Color): Color {
  return createColor({ ...color.hsl });
}

function colorsEqual(a: Color, b: Color): boolean {
  return a.hex === b.hex;
}

export class PaletteStore {
  #state = $state<PaletteState>({ ...DEFAULT_STATE });
  /** Locked palette slots keyed by index; locked colors stay fixed while the base changes. */
  #locks = $state<Record<number, Color>>({});
  /** Which palette swatch the color picker is editing. */
  #selectedIndex = $state(0);
  #past = $state<HistoryEntry[]>([]);
  #future = $state<HistoryEntry[]>([]);
  #lastKey: string | null = null;
  #lastTime = 0;

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
    return this.#past.length > 0;
  }

  get canRedo(): boolean {
    return this.#future.length > 0;
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

  /**
   * Push the current state onto the undo stack before a change. Repeated edits with the same
   * key in quick succession share one entry, so a slider drag undoes in a single step.
   */
  #record(key?: string): void {
    const now = Date.now();
    if (key && key === this.#lastKey && now - this.#lastTime < COALESCE_MS) {
      this.#lastTime = now;
      return;
    }
    this.#past = [...this.#past.slice(-(HISTORY_LIMIT - 1)), this.#capture()];
    this.#future = [];
    this.#lastKey = key ?? null;
    this.#lastTime = now;
  }

  undo(): void {
    const previous = this.#past.at(-1);
    if (!previous) return;
    this.#future = [...this.#future, this.#capture()];
    this.#past = this.#past.slice(0, -1);
    this.#restore(previous);
    this.#lastKey = null;
  }

  redo(): void {
    const next = this.#future.at(-1);
    if (!next) return;
    this.#past = [...this.#past, this.#capture()];
    this.#future = this.#future.slice(0, -1);
    this.#restore(next);
    this.#lastKey = null;
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

    const next = createColor({
      h: Math.max(0, Math.min(360, hsl.h)),
      s: Math.max(0, Math.min(100, hsl.s)),
      l: Math.max(0, Math.min(100, hsl.l))
    });

    const current = this.colors[index]?.hsl;
    if (current && current.h === next.hsl.h && current.s === next.hsl.s && current.l === next.hsl.l) {
      return;
    }
    this.#record(`edit:${index}`);

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
    if (generated && !colorsEqual(generated, next)) {
      this.#locks = { ...this.#locks, [index]: next };
    }
  }

  setSelectedHue(value: number): void {
    if (!Number.isFinite(value)) return;
    this.setSelectedHsl({
      ...this.selectedColor.hsl,
      h: Math.max(0, Math.min(360, value))
    });
  }

  setSelectedSaturation(value: number): void {
    if (!Number.isFinite(value)) return;
    this.setSelectedHsl({
      ...this.selectedColor.hsl,
      s: Math.max(0, Math.min(100, value))
    });
  }

  setSelectedLightness(value: number): void {
    if (!Number.isFinite(value)) return;
    this.setSelectedHsl({
      ...this.selectedColor.hsl,
      l: Math.max(0, Math.min(100, value))
    });
  }

  toggleLock(index: number): void {
    if (!Number.isInteger(index) || index < 0) return;
    if (index >= this.colors.length) return;
    this.#record();

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
    if (this.lockedCount > 0) this.#record();
    this.#locks = {};
  }

  setHue(value: number): void {
    if (!Number.isFinite(value)) return;
    this.#record('base');
    this.#state.hue = Math.max(0, Math.min(360, value));
  }

  setSaturation(value: number): void {
    if (!Number.isFinite(value)) return;
    this.#record('base');
    this.#state.saturation = Math.max(0, Math.min(100, value));
  }

  setLightness(value: number): void {
    if (!Number.isFinite(value)) return;
    this.#record('base');
    this.#state.lightness = Math.max(0, Math.min(100, value));
  }

  setHarmony(value: HarmonyType): void {
    if (value === this.#state.harmony) return;
    this.#record();
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

    this.#state = {
      hue: snapshot.hue,
      saturation: snapshot.saturation,
      lightness: snapshot.lightness,
      harmony: snapshot.harmony
    };
    this.#locks = {};
    this.#selectedIndex = 0;
    return true;
  }

  /** Load a preset or other snapshot as an undoable edit. */
  load(snapshot: PaletteSnapshot): boolean {
    const before = this.#capture();
    if (!this.hydrate(snapshot)) return false;
    this.#past = [...this.#past.slice(-(HISTORY_LIMIT - 1)), before];
    this.#future = [];
    this.#lastKey = null;
    return true;
  }

  /** Randomize the base HSL only; locked palette slots stay put. */
  randomize(): void {
    this.#record();
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
