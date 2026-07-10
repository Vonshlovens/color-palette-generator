import { describe, expect, it } from 'vitest';
import { HARMONY_TYPES, type HSL, type HarmonyType } from '$lib/types';
import { generatePalette } from './harmonies';

const base: HSL = { h: 350, s: 82, l: 46 };

const cases: Array<{
  harmony: HarmonyType;
  hues: number[];
  baseIndex: number;
  expectedBase: HSL;
}> = [
  {
    harmony: 'complementary',
    hues: [350, 350, 170, 170, 80],
    baseIndex: 0,
    expectedBase: base
  },
  {
    harmony: 'analogous',
    hues: [320, 335, 350, 5, 20],
    baseIndex: 2,
    expectedBase: base
  },
  {
    harmony: 'triadic',
    hues: [350, 350, 110, 230, 230],
    baseIndex: 0,
    expectedBase: base
  },
  {
    harmony: 'split-complementary',
    hues: [350, 350, 140, 200, 350],
    baseIndex: 0,
    expectedBase: base
  },
  {
    harmony: 'tetradic',
    hues: [350, 50, 170, 230, 110],
    baseIndex: 0,
    expectedBase: base
  },
  {
    harmony: 'monochromatic',
    hues: [350, 350, 350, 350, 350],
    baseIndex: 2,
    expectedBase: { h: 350, s: 100, l: 50 }
  }
];

describe('harmony algorithms', () => {
  it.each(cases)(
    'generates the specified $harmony hue relationships and base behavior',
    ({ harmony, hues, baseIndex, expectedBase }) => {
      const palette = generatePalette(base, harmony);

      expect(palette).toHaveLength(5);
      expect(palette.map((color) => color.hsl.h)).toEqual(hues);
      expect(palette[baseIndex].hsl).toEqual(expectedBase);

      for (const color of palette) {
        expect(color.hsl.h).toBeGreaterThanOrEqual(0);
        expect(color.hsl.h).toBeLessThanOrEqual(360);
        expect(color.hsl.s).toBeGreaterThanOrEqual(0);
        expect(color.hsl.s).toBeLessThanOrEqual(100);
        expect(color.hsl.l).toBeGreaterThanOrEqual(0);
        expect(color.hsl.l).toBeLessThanOrEqual(100);
        expect(color.rgb.r).toBeGreaterThanOrEqual(0);
        expect(color.rgb.r).toBeLessThanOrEqual(255);
        expect(color.rgb.g).toBeGreaterThanOrEqual(0);
        expect(color.rgb.g).toBeLessThanOrEqual(255);
        expect(color.rgb.b).toBeGreaterThanOrEqual(0);
        expect(color.rgb.b).toBeLessThanOrEqual(255);
        expect(color.hex).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  );

  it('clamps adjusted channels at valid input boundaries', () => {
    for (const harmony of HARMONY_TYPES) {
      for (const color of generatePalette({ h: 0, s: 0, l: 100 }, harmony)) {
        expect(color.hsl.s).toBeGreaterThanOrEqual(0);
        expect(color.hsl.s).toBeLessThanOrEqual(100);
        expect(color.hsl.l).toBeGreaterThanOrEqual(0);
        expect(color.hsl.l).toBeLessThanOrEqual(100);
      }
    }
  });
});
