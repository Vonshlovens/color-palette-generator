import type { HSL, Color, HarmonyType } from '$lib/types';
import { createColor, normalizeHue, clamp } from './conversions';

/**
 * Generate a color palette based on harmony type
 */
export function generatePalette(baseHsl: HSL, harmony: HarmonyType): Color[] {
  switch (harmony) {
    case 'complementary':
      return generateComplementary(baseHsl);
    case 'analogous':
      return generateAnalogous(baseHsl);
    case 'triadic':
      return generateTriadic(baseHsl);
    case 'split-complementary':
      return generateSplitComplementary(baseHsl);
    case 'tetradic':
      return generateTetradic(baseHsl);
    case 'monochromatic':
      return generateMonochromatic(baseHsl);
    default:
      return generateComplementary(baseHsl);
  }
}

/**
 * Complementary: Base + opposite on color wheel
 */
function generateComplementary(base: HSL): Color[] {
  const { h, s, l } = base;
  const complementHue = normalizeHue(h + 180);

  return [
    createColor({ h, s, l }),
    createColor({ h, s: clamp(s - 15, 0, 100), l: clamp(l + 20, 0, 100) }),
    createColor({ h: complementHue, s, l }),
    createColor({ h: complementHue, s: clamp(s - 15, 0, 100), l: clamp(l + 20, 0, 100) }),
    createColor({ h: normalizeHue(h + 90), s: 20, l: 50 })
  ];
}

/**
 * Analogous: Colors adjacent on the wheel
 */
function generateAnalogous(base: HSL): Color[] {
  const { h, s, l } = base;

  return [
    createColor({ h: normalizeHue(h - 30), s, l }),
    createColor({ h: normalizeHue(h - 15), s, l }),
    createColor({ h, s, l }),
    createColor({ h: normalizeHue(h + 15), s, l }),
    createColor({ h: normalizeHue(h + 30), s, l })
  ];
}

/**
 * Triadic: Three colors evenly spaced (120° apart)
 */
function generateTriadic(base: HSL): Color[] {
  const { h, s, l } = base;
  const second = normalizeHue(h + 120);
  const third = normalizeHue(h + 240);

  return [
    createColor({ h, s, l }),
    createColor({ h, s: clamp(s - 20, 0, 100), l: clamp(l + 15, 0, 100) }),
    createColor({ h: second, s, l }),
    createColor({ h: third, s, l }),
    createColor({ h: third, s: clamp(s - 20, 0, 100), l: clamp(l - 15, 0, 100) })
  ];
}

/**
 * Split-Complementary: Base + two adjacent to complement
 */
function generateSplitComplementary(base: HSL): Color[] {
  const { h, s, l } = base;
  const split1 = normalizeHue(h + 150);
  const split2 = normalizeHue(h + 210);

  return [
    createColor({ h, s, l }),
    createColor({ h, s: clamp(s - 20, 0, 100), l: clamp(l + 20, 0, 100) }),
    createColor({ h: split1, s, l }),
    createColor({ h: split2, s, l }),
    createColor({ h, s: 20, l: clamp(l + 10, 0, 100) })
  ];
}

/**
 * Tetradic: Four colors in rectangle pattern
 */
function generateTetradic(base: HSL): Color[] {
  const { h, s, l } = base;

  return [
    createColor({ h, s, l }),
    createColor({ h: normalizeHue(h + 60), s, l }),
    createColor({ h: normalizeHue(h + 180), s, l }),
    createColor({ h: normalizeHue(h + 240), s, l }),
    createColor({ h: normalizeHue(h + 120), s: 25, l: 50 })
  ];
}

/**
 * Monochromatic: Single hue with varied saturation/lightness
 */
function generateMonochromatic(base: HSL): Color[] {
  const { h } = base;

  return [
    createColor({ h, s: 90, l: 25 }),
    createColor({ h, s: 85, l: 40 }),
    createColor({ h, s: 100, l: 50 }),
    createColor({ h, s: 70, l: 65 }),
    createColor({ h, s: 50, l: 80 })
  ];
}

/**
 * Get display name for harmony type
 */
export function getHarmonyName(harmony: HarmonyType): string {
  const names: Record<HarmonyType, string> = {
    complementary: 'Complementary',
    analogous: 'Analogous',
    triadic: 'Triadic',
    'split-complementary': 'Split-Complementary',
    tetradic: 'Tetradic',
    monochromatic: 'Monochromatic'
  };
  return names[harmony];
}

/**
 * Get description for harmony type
 */
export function getHarmonyDescription(harmony: HarmonyType): string {
  const descriptions: Record<HarmonyType, string> = {
    complementary: 'Two colors opposite on the color wheel',
    analogous: 'Colors adjacent on the wheel for cohesion',
    triadic: 'Three colors evenly spaced for balance',
    'split-complementary': 'Base with two adjacent to its complement',
    tetradic: 'Four colors forming a rectangle',
    monochromatic: 'Single hue with varied intensity'
  };
  return descriptions[harmony];
}
