import { describe, expect, it } from 'vitest';
import { getWcagLevel, hexToRgb } from './conversions';
import { formatOklch, oklchToRgb, rgbToOklch } from './oklch';
import { generateShadeScale, nearestStop, SHADE_STOPS } from './scales';
import { findConfusablePairs, simulateCvd } from './vision';
import { createColor } from './conversions';

const rgb = (hex: string) => hexToRgb(hex)!;

describe('OKLCH', () => {
  // Reference values from the CSS Color 4 spec / culori.
  it.each([
    ['#ff0000', 'oklch(62.8% 0.258 29.2)'],
    ['#0000ff', 'oklch(45.2% 0.313 264.1)'],
    ['#ffffff', 'oklch(100% 0 0)'],
    ['#000000', 'oklch(0% 0 0)']
  ])('formats %s as %s', (hex, expected) => {
    expect(formatOklch(rgb(hex))).toBe(expected);
  });

  it('round-trips in-gamut sRGB colors', () => {
    for (const hex of ['#3b82f6', '#d99d26', '#29513f', '#ee3aa0']) {
      expect(oklchToRgb(rgbToOklch(rgb(hex)))).toEqual(rgb(hex));
    }
  });

  it('maps out-of-gamut colors by reducing chroma, keeping lightness and hue', () => {
    const target = { l: 0.7, c: 0.4, h: 145 };
    const mapped = rgbToOklch(oklchToRgb(target));
    expect(mapped.c).toBeLessThan(0.4);
    expect(mapped.l).toBeCloseTo(0.7, 2);
    expect(mapped.h).toBeCloseTo(145, 0);
  });
});

describe('shade scales', () => {
  const scale = generateShadeScale(createColor({ h: 220, s: 70, l: 50 }));

  it('produces 50–950 with strictly decreasing lightness', () => {
    expect(scale.map((shade) => shade.stop)).toEqual([...SHADE_STOPS]);
    const lightness = scale.map((shade) => rgbToOklch(shade.color.rgb).l);
    for (let i = 1; i < lightness.length; i++) {
      expect(lightness[i]).toBeLessThan(lightness[i - 1]);
    }
  });

  it('keeps the source hue across the mid ramp', () => {
    const sourceHue = rgbToOklch(createColor({ h: 220, s: 70, l: 50 }).rgb).h;
    for (const shade of scale.slice(2, 9)) {
      expect(Math.abs(rgbToOklch(shade.color.rgb).h - sourceHue)).toBeLessThan(3);
    }
  });

  it('matches lightness across hues so the same stop has the same weight', () => {
    const yellow = generateShadeScale(createColor({ h: 55, s: 90, l: 50 }));
    const l = (color: { rgb: { r: number; g: number; b: number } }) => rgbToOklch(color.rgb).l;
    expect(l(yellow[6].color)).toBeCloseTo(l(scale[6].color), 2);
  });

  it('finds the nearest stop for a color', () => {
    expect(nearestStop(createColor({ h: 0, s: 0, l: 98 }))).toBe(50);
    expect(nearestStop(createColor({ h: 0, s: 0, l: 5 }))).toBe(950);
  });
});

describe('WCAG levels', () => {
  it.each([
    [7, 'AAA'],
    [6.99, 'AA'],
    [4.5, 'AA'],
    [4.49, 'AA Large'],
    [3, 'AA Large'],
    [2.99, 'Fail']
  ] as const)('rates %d:1 as %s', (ratio, level) => {
    expect(getWcagLevel(ratio)).toBe(level);
  });
});

describe('color-vision simulation', () => {
  it('preserves white, black, and greys', () => {
    for (const type of ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as const) {
      expect(simulateCvd({ r: 255, g: 255, b: 255 }, type)).toEqual({ r: 255, g: 255, b: 255 });
      expect(simulateCvd({ r: 0, g: 0, b: 0 }, type)).toEqual({ r: 0, g: 0, b: 0 });
      expect(simulateCvd({ r: 119, g: 119, b: 119 }, type)).toEqual({ r: 119, g: 119, b: 119 });
    }
  });

  it('removes all hue under achromatopsia', () => {
    const { r, g, b } = simulateCvd(rgb('#e01e3c'), 'achromatopsia');
    expect(r).toBe(g);
    expect(g).toBe(b);
  });

  it('flags red and green as confusable for red-green deficiencies but not for tritanopia', () => {
    const colors = [rgb('#d0312d'), rgb('#6d8b22')];
    expect(findConfusablePairs(colors, 'deuteranopia')).toEqual([[0, 1]]);
    expect(findConfusablePairs(colors, 'tritanopia')).toEqual([]);
  });

  it('does not flag pairs that were already indistinct for typical vision', () => {
    expect(findConfusablePairs([rgb('#3b82f6'), rgb('#3c83f6')], 'protanopia')).toEqual([]);
  });
});
