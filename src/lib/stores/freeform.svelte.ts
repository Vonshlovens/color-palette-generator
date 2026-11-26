import {
  MAX_PALETTE_COLORS,
  MIN_PALETTE_COLORS,
  type Color,
  type FreeformSnapshot,
  type HSL
} from '$lib/types';
import { clamp, createColor, hslEqual, isValidHsl } from '$lib/color/conversions';
import { EditHistory } from './history.svelte';

const DEFAULT_COLORS: HSL[] = [
  { h: 211, s: 72, l: 46 },
  { h: 32, s: 88, l: 58 },
  { h: 158, s: 42, l: 38 },
  { h: 348, s: 70, l: 62 },
  { h: 48, s: 30, l: 90 }
];

interface HistoryEntry {
  colors: Color[];
  locked: number[];
  selectedIndex: number;
}

/** A color drawn uniformly from the whole HSL space; no harmony rule relates the swatches. */
export function randomHsl(random: () => number = Math.random): HSL {
  return {
    h: Math.floor(random() * 360),
    s: Math.floor(random() * 101),
    l: Math.floor(random() * 101)
  };
}

/**
 * Freeform palettes: one to seven independent swatches. Shuffle replaces every unlocked swatch
 * with a random color; locked swatches keep theirs.
 */
export class FreeformStore {
  readonly harmony = 'freeform' as const;
  #colors = $state<Color[]>(DEFAULT_COLORS.map(createColor));
  #locked = $state<number[]>([]);
  #selectedIndex = $state(0);
  #history = new EditHistory<HistoryEntry>(
    () => ({ colors: [...this.#colors], locked: [...this.#locked], selectedIndex: this.#selectedIndex }),
    (entry) => {
      this.#colors = [...entry.colors];
      this.#locked = [...entry.locked];
      this.#selectedIndex = entry.selectedIndex;
    }
  );

  constructor(snapshot?: FreeformSnapshot) {
    if (snapshot) this.hydrate(snapshot);
  }

  get colors(): Color[] {
    return this.#colors;
  }

  get selectedIndex(): number {
    return this.#selectedIndex;
  }

  get selectedColor(): Color {
    return this.#colors[this.#selectedIndex] ?? this.#colors[0];
  }

  get lockedCount(): number {
    return this.#locked.length;
  }

  get canAdd(): boolean {
    return this.#colors.length < MAX_PALETTE_COLORS;
  }

  get canRemove(): boolean {
    return this.#colors.length > MIN_PALETTE_COLORS;
  }

  get canUndo(): boolean {
    return this.#history.canUndo;
  }

  get canRedo(): boolean {
    return this.#history.canRedo;
  }

  undo(): void {
    this.#history.undo();
  }

  redo(): void {
    this.#history.redo();
  }

  isLocked(index: number): boolean {
    return this.#locked.includes(index);
  }

  selectColor(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.#colors.length) return;
    this.#selectedIndex = index;
  }

  /** Edit the selected swatch in place; freeform swatches have no siblings to follow. */
  setSelectedHsl(hsl: HSL): void {
    const index = this.#selectedIndex;
    const next = { h: clamp(hsl.h, 0, 360), s: clamp(hsl.s, 0, 100), l: clamp(hsl.l, 0, 100) };
    if (!isValidHsl(next) || hslEqual(this.#colors[index].hsl, next)) return;
    this.#history.record(`edit:${index}`);
    this.#colors = this.#colors.map((color, i) => (i === index ? createColor(next) : color));
  }

  setSelectedHue(value: number): void {
    if (Number.isFinite(value)) this.setSelectedHsl({ ...this.selectedColor.hsl, h: value });
  }

  setSelectedSaturation(value: number): void {
    if (Number.isFinite(value)) this.setSelectedHsl({ ...this.selectedColor.hsl, s: value });
  }

  setSelectedLightness(value: number): void {
    if (Number.isFinite(value)) this.setSelectedHsl({ ...this.selectedColor.hsl, l: value });
  }

  toggleLock(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.#colors.length) return;
    this.#history.record();
    this.#locked = this.isLocked(index)
      ? this.#locked.filter((i) => i !== index)
      : [...this.#locked, index];
  }

  clearLocks(): void {
    if (this.#locked.length === 0) return;
    this.#history.record();
    this.#locked = [];
  }

  /** Append a random swatch (up to seven) and select it. */
  addColor(random: () => number = Math.random): void {
    if (!this.canAdd) return;
    this.#history.record();
    this.#colors = [...this.#colors, createColor(randomHsl(random))];
    this.#selectedIndex = this.#colors.length - 1;
  }

  /** Remove a swatch (down to one); later locks shift down with their swatches. */
  removeColor(index: number): void {
    if (!this.canRemove || !Number.isInteger(index) || index < 0 || index >= this.#colors.length) {
      return;
    }
    this.#history.record();
    this.#colors = this.#colors.filter((_, i) => i !== index);
    this.#locked = this.#locked.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i));
    if (this.#selectedIndex >= index && this.#selectedIndex > 0) this.#selectedIndex -= 1;
  }

  /** Give every unlocked swatch a completely random color. */
  randomize(random: () => number = Math.random): void {
    if (this.#locked.length === this.#colors.length) return;
    this.#history.record();
    this.#colors = this.#colors.map((color, index) =>
      this.isLocked(index) ? color : createColor(randomHsl(random))
    );
  }

  snapshot(): FreeformSnapshot {
    return Object.freeze({
      harmony: 'freeform' as const,
      colors: this.#colors.map((color) => ({ ...color.hsl }))
    });
  }

  hydrate(snapshot: FreeformSnapshot): boolean {
    const { colors } = snapshot;
    if (
      snapshot.harmony !== 'freeform' ||
      colors.length < MIN_PALETTE_COLORS ||
      colors.length > MAX_PALETTE_COLORS ||
      !colors.every(isValidHsl)
    ) {
      return false;
    }
    this.#colors = colors.map((hsl) => createColor({ h: hsl.h, s: hsl.s, l: hsl.l }));
    this.#locked = [];
    this.#selectedIndex = 0;
    return true;
  }

  /** Load a saved palette as an undoable edit. */
  load(snapshot: FreeformSnapshot): boolean {
    const before = { colors: [...this.#colors], locked: [...this.#locked], selectedIndex: this.#selectedIndex };
    if (!this.hydrate(snapshot)) return false;
    this.#history.push(before);
    return true;
  }
}

export function createFreeformStore(snapshot?: FreeformSnapshot): FreeformStore {
  return new FreeformStore(snapshot);
}
