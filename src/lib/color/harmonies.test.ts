import { describe, expect, it } from 'vitest';
import { HARMONY_TYPES, type HSL, type HarmonyType } from '$lib/types';
import { generatePalette, HARMONY_COLOR_COUNTS } from './harmonies';

const base: HSL = { h: 350, s: 82, l: 46 };

const cases: Array<{
  harmony: HarmonyType;
  hues: number[];
  baseIndex: number;
  expectedBase: HSL;
}> = [
  {
    harmony: 'complementary',
    hues: [350, 170],
    baseIndex: 0,
    expectedBase: base
  },
  {
    harmony: 'analogous',
    hues: [320, 350, 20],
    baseIndex: 1,
    expectedBase: base
  },
  {
    harmony: 'triadic',
    hues: [350, 110, 230],
    baseIndex: 0,
    expectedBase: base
  },
  {
    harmony: 'split-complementary',
    hues: [350, 140, 200],
    baseIndex: 0,
    expectedBase: base
  },
  {
    harmony: 'tetradic',
    hues: [350, 50, 170, 230],
    baseIndex: 0,
    expectedBase: base
  },
  {
    harmony: 'monochromatic',
    hues: [350, 350, 350, 350, 350],
    baseIndex: 2,
    expectedBase: { h: 350, s: 100, l: 50 }
  },
  {
    harmony: '60-30-10',
    hues: [350, 350, 170],
    baseIndex: 0,
    expectedBase: { h: 350, s: 67, l: 68 }
  }
];

describe('harmony algorithms', () => {
  it.each(cases)(
    'generates the specified $harmony hue relationships and base behavior',
    ({ harmony, hues, baseIndex, expectedBase }) => {
      const palette = generatePalette(base, harmony);

      expect(palette).toHaveLength(HARMONY_COLOR_COUNTS[harmony]);
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

  it('tracks base HSL changes in 60-30-10 roles', () => {
    const cool = generatePalette({ h: 220, s: 70, l: 50 }, '60-30-10');
    const warm = generatePalette({ h: 30, s: 70, l: 50 }, '60-30-10');
    const darker = generatePalette({ h: 220, s: 70, l: 30 }, '60-30-10');
    const softer = generatePalette({ h: 220, s: 30, l: 50 }, '60-30-10');

    expect(cool.map((c) => c.hex)).not.toEqual(warm.map((c) => c.hex));
    expect(cool[0].hsl.l).toBeGreaterThan(darker[0].hsl.l);
    expect(cool[1].hsl.l).toBeGreaterThan(darker[1].hsl.l);
    expect(cool[2].hsl.l).toBeGreaterThan(darker[2].hsl.l);
    expect(cool[0].hsl.s).toBeGreaterThan(softer[0].hsl.s);
    expect(cool[2].hsl.h).toBe(40);
    expect(warm[2].hsl.h).toBe(210);
  });

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

  it('covers every harmony type with a documented color count', () => {
    expect(Object.keys(HARMONY_COLOR_COUNTS).sort()).toEqual([...HARMONY_TYPES].sort());
  });
});
