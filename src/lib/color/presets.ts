import type { PaletteState } from '$lib/types';

export interface PalettePreset extends PaletteState {
  id: string;
  name: string;
  /** One line on where the palette works well. */
  note: string;
}

/** Curated starting points, each a canonical HSL seed plus a harmony rule. */
export const PALETTE_PRESETS: readonly PalettePreset[] = [
  {
    id: 'fjord',
    name: 'Fjord',
    note: 'Cool analogous blues for calm product surfaces',
    hue: 204,
    saturation: 62,
    lightness: 42,
    harmony: 'analogous'
  },
  {
    id: 'marigold',
    name: 'Marigold market',
    note: 'Warm saffron split against plum and teal',
    hue: 40,
    saturation: 90,
    lightness: 52,
    harmony: 'split-complementary'
  },
  {
    id: 'lichen',
    name: 'Lichen',
    note: 'A quiet moss ramp for editorial and print',
    hue: 92,
    saturation: 34,
    lightness: 44,
    harmony: 'monochromatic'
  },
  {
    id: 'signal',
    name: 'Signal',
    note: 'High-energy crimson with a cyan counterpoint',
    hue: 352,
    saturation: 78,
    lightness: 50,
    harmony: 'complementary'
  },
  {
    id: 'nocturne',
    name: 'Nocturne',
    note: 'Indigo triad with ember and jade highlights',
    hue: 248,
    saturation: 56,
    lightness: 40,
    harmony: 'triadic'
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    note: 'Sage canvas, forest structure, coral calls to action',
    hue: 152,
    saturation: 38,
    lightness: 46,
    harmony: '60-30-10'
  },
  {
    id: 'riso',
    name: 'Riso',
    note: 'Fluorescent pink rectangle for posters and zines',
    hue: 326,
    saturation: 84,
    lightness: 58,
    harmony: 'tetradic'
  },
  {
    id: 'harbor',
    name: 'Harbor',
    note: 'Navy and sand dashboard with a signal orange accent',
    hue: 214,
    saturation: 48,
    lightness: 54,
    harmony: '60-30-10'
  }
];
