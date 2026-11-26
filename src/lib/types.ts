export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface Color {
  hsl: HSL;
  rgb: RGB;
  hex: string;
}

export const HARMONY_TYPES = [
  'complementary',
  'analogous',
  'triadic',
  'split-complementary',
  'tetradic',
  'monochromatic',
  '60-30-10'
] as const;

export type HarmonyType = (typeof HARMONY_TYPES)[number];

/** What produced a saved palette: a harmony rule, or hand-picked freeform swatches. */
export const PALETTE_KINDS = [...HARMONY_TYPES, 'freeform'] as const;

export type PaletteKind = (typeof PALETTE_KINDS)[number];

/** A palette holds between one and seven swatches. */
export const MIN_PALETTE_COLORS = 1;
export const MAX_PALETTE_COLORS = 7;

export interface Palette {
  baseColor: Color;
  harmony: HarmonyType;
  colors: Color[];
}

export interface PaletteState {
  hue: number;
  saturation: number;
  lightness: number;
  harmony: HarmonyType;
}

/**
 * A harmony studio palette: its generator inputs plus, when present, the exact swatches on
 * screen, which differ from the generated ones wherever a swatch was locked or edited.
 */
export interface PaletteSnapshot extends Readonly<PaletteState> {
  readonly colors?: readonly HSL[];
}

/** A freeform palette: one to seven hand-picked swatches with no generator behind them. */
export interface FreeformSnapshot {
  readonly harmony: 'freeform';
  readonly colors: readonly HSL[];
}

export interface SavedPalette {
  slug: string;
  name: string;
  /** Generator seed; for freeform palettes, the first swatch. */
  hue: number;
  saturation: number;
  lightness: number;
  harmony: PaletteKind;
  /** The exact swatches, in order. */
  colors: HSL[];
  /** Whether the current viewer may rename or delete this palette. */
  canManage: boolean;
  createdAt: string;
  updatedAt: string;
}
