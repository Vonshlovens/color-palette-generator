import { describe, expect, it } from 'vitest';
import {
  clamp,
  getContrastRatio,
  getContrastTextColor,
  getLuminance,
  hexToHsl,
  hexToRgb,
  hslToRgb,
  normalizeHue,
  rgbToHex,
  rgbToHsl
} from './conversions';

describe('color conversions', () => {
  it.each([
    [{ h: 0, s: 100, l: 50 }, { r: 255, g: 0, b: 0 }],
    [{ h: 120, s: 100, l: 50 }, { r: 0, g: 255, b: 0 }],
    [{ h: 240, s: 100, l: 50 }, { r: 0, g: 0, b: 255 }],
    [{ h: 0, s: 0, l: 50 }, { r: 128, g: 128, b: 128 }]
  ])('converts HSL %o to RGB', (hsl, rgb) => {
    expect(hslToRgb(hsl)).toEqual(rgb);
  });

  it('round-trips representative RGB values without losing channel precision', () => {
    const rgb = { r: 64, g: 128, b: 191 };
    const hsl = rgbToHsl(rgb);
    const roundTrip = hslToRgb(hsl);

    expect(roundTrip).toEqual(rgb);
  });

  it('preserves arbitrary RGB values through the canonical HSL representation', () => {
    const rgb = { r: 15, g: 160, b: 255 };

    expect(hslToRgb(rgbToHsl(rgb))).toEqual(rgb);
  });

  it('converts RGB and six-digit HEX in both directions', () => {
    expect(rgbToHex({ r: 15, g: 160, b: 255 })).toBe('#0fa0ff');
    expect(hexToRgb('#0FA0ff')).toEqual({ r: 15, g: 160, b: 255 });
    expect(hexToRgb('0fa0ff')).toEqual({ r: 15, g: 160, b: 255 });
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('rejects malformed HEX values', () => {
    expect(hexToRgb('#fff')).toBeNull();
    expect(hexToRgb('#gg0000')).toBeNull();
    expect(hexToHsl('not-a-color')).toBeNull();
  });

  it('normalizes hue and clamps channel values', () => {
    expect(normalizeHue(-30)).toBe(330);
    expect(normalizeHue(390)).toBe(30);
    expect(clamp(-1, 0, 100)).toBe(0);
    expect(clamp(101, 0, 100)).toBe(100);
  });
});

describe('WCAG contrast', () => {
  const black = { r: 0, g: 0, b: 0 };
  const white = { r: 255, g: 255, b: 255 };

  it('calculates the relative luminance endpoints', () => {
    expect(getLuminance(black)).toBe(0);
    expect(getLuminance(white)).toBe(1);
  });

  it('calculates a symmetric 21:1 contrast ratio for black and white', () => {
    expect(getContrastRatio(black, white)).toBe(21);
    expect(getContrastRatio(white, black)).toBe(21);
  });

  it('matches a known WCAG contrast ratio', () => {
    expect(getContrastRatio({ r: 119, g: 119, b: 119 }, white)).toBeCloseTo(4.478, 3);
  });

  it('chooses whichever text color has greater contrast', () => {
    expect(getContrastTextColor(black)).toBe('light');
    expect(getContrastTextColor(white)).toBe('dark');
    expect(getContrastTextColor({ r: 119, g: 119, b: 119 })).toBe('dark');
  });
});
