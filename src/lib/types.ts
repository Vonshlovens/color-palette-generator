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

export type HarmonyType =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split-complementary'
  | 'tetradic'
  | 'monochromatic';

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
