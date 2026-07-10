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
  'monochromatic'
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

export type PaletteSnapshot = Readonly<PaletteState>;

export interface SavedPalette {
  slug: string;
  name: string;
  hue: number;
  saturation: number;
  lightness: number;
  harmony: HarmonyType;
  createdAt: string;
  updatedAt: string;
}
