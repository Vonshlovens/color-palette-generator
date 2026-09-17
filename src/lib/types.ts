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

/** A persisted HSL override for a palette slot that was deliberately locked. */
export interface LockedSwatch {
  index: number;
  h: number;
  s: number;
  l: number;
}

/**
 * The complete generator state required to reproduce a saved palette.
 *
 * Locked swatches are stored as HSL overrides rather than derived HEX/RGB output, so a saved
 * palette remains faithful to the workspace while keeping HSL as the canonical color space.
 */
export interface PaletteSnapshot extends PaletteState {
  lockedSwatches?: readonly LockedSwatch[];
}

export interface SavedPalette extends PaletteSnapshot {
  slug: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
