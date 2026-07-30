import type { HSL, Color, HarmonyType } from '$lib/types';
import { createColor, normalizeHue, clamp } from './conversions';

/** Expected swatch count for each harmony (true to the color-theory relationship). */
export const HARMONY_COLOR_COUNTS: Record<HarmonyType, number> = {
  complementary: 2,
  analogous: 3,
  triadic: 3,
  'split-complementary': 3,
  tetradic: 4,
  monochromatic: 5,
  '60-30-10': 3
};

export const SIXTY_THIRTY_TEN_ROLES = ['Dominant 60%', 'Secondary 30%', 'Accent 10%'] as const;

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
    case '60-30-10':
      return generateSixtyThirtyTen(baseHsl);
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

  return [createColor({ h, s, l }), createColor({ h: complementHue, s, l })];
}

/**
 * Analogous: Colors adjacent on the wheel
 */
function generateAnalogous(base: HSL): Color[] {
  const { h, s, l } = base;

  return [
    createColor({ h: normalizeHue(h - 30), s, l }),
    createColor({ h, s, l }),
    createColor({ h: normalizeHue(h + 30), s, l })
  ];
}

/**
 * Triadic: Three colors evenly spaced (120° apart)
 */
function generateTriadic(base: HSL): Color[] {
  const { h, s, l } = base;

  return [
    createColor({ h, s, l }),
    createColor({ h: normalizeHue(h + 120), s, l }),
    createColor({ h: normalizeHue(h + 240), s, l })
  ];
}

/**
 * Split-Complementary: Base + two adjacent to complement
 */
function generateSplitComplementary(base: HSL): Color[] {
  const { h, s, l } = base;

  return [
    createColor({ h, s, l }),
    createColor({ h: normalizeHue(h + 150), s, l }),
    createColor({ h: normalizeHue(h + 210), s, l })
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
    createColor({ h: normalizeHue(h + 240), s, l })
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
 * 60-30-10: Dominant surface, secondary support, and accent colors for UI systems.
 * Roles use relative offsets from the base so H/S/L slider changes stay visible.
 */
function generateSixtyThirtyTen(base: HSL): Color[] {
  const { h, s, l } = base;
  const accentHue = normalizeHue(h + 180);

  return [
    // Dominant 60% — lighter, slightly softer base for large surfaces
    createColor({
      h,
      s: clamp(s - 15, 0, 100),
      l: clamp(l + 22, 0, 96)
    }),
    // Secondary 30% — deeper base for nav, cards, supporting blocks
    createColor({
      h,
      s: clamp(s - 5, 0, 100),
      l: clamp(l - 22, 4, 100)
    }),
    // Accent 10% — complementary of the live base for CTAs / highlights
    createColor({
      h: accentHue,
      s: clamp(s + 10, 0, 100),
      l
    })
  ];
}

/**
 * Infer the canonical base HSL that would place `target` at `index` for the given harmony.
 * Used when the user edits a selected swatch so the generator seed stays in sync.
 */
export function inferBaseFromSwatch(harmony: HarmonyType, index: number, target: HSL): HSL {
  const { h, s, l } = target;

  switch (harmony) {
    case 'complementary':
      return index === 1 ? { h: normalizeHue(h - 180), s, l } : { h, s, l };
    case 'analogous':
      if (index === 0) return { h: normalizeHue(h + 30), s, l };
      if (index === 2) return { h: normalizeHue(h - 30), s, l };
      return { h, s, l };
    case 'triadic':
      if (index === 1) return { h: normalizeHue(h - 120), s, l };
      if (index === 2) return { h: normalizeHue(h - 240), s, l };
      return { h, s, l };
    case 'split-complementary':
      if (index === 1) return { h: normalizeHue(h - 150), s, l };
      if (index === 2) return { h: normalizeHue(h - 210), s, l };
      return { h, s, l };
    case 'tetradic':
      if (index === 1) return { h: normalizeHue(h - 60), s, l };
      if (index === 2) return { h: normalizeHue(h - 180), s, l };
      if (index === 3) return { h: normalizeHue(h - 240), s, l };
      return { h, s, l };
    case 'monochromatic':
      // Generator uses hue only; keep the edited S/L on the snapshot for save/share.
      return { h, s, l };
    case '60-30-10':
      if (index === 0) {
        return { h, s: clamp(s + 15, 0, 100), l: clamp(l - 22, 0, 100) };
      }
      if (index === 1) {
        return { h, s: clamp(s + 5, 0, 100), l: clamp(l + 22, 0, 100) };
      }
      return { h: normalizeHue(h - 180), s: clamp(s - 10, 0, 100), l };
    default:
      return { h, s, l };
  }
}

/** Human-readable label for a palette slot (roles for 60-30-10, otherwise Color N). */
export function getSwatchLabel(harmony: HarmonyType, index: number): string {
  if (harmony === '60-30-10') {
    return SIXTY_THIRTY_TEN_ROLES[index] ?? `Color ${index + 1}`;
  }
  return `Color ${index + 1}`;
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
    monochromatic: 'Monochromatic',
    '60-30-10': '60-30-10'
  };
  return names[harmony];
}

/**
 * Get description for harmony type
 */
export function getHarmonyDescription(harmony: HarmonyType): string {
  const descriptions: Record<HarmonyType, string> = {
    complementary: 'Two colors opposite on the color wheel',
    analogous: 'Three neighboring hues for cohesion',
    triadic: 'Three colors evenly spaced for balance',
    'split-complementary': 'Base with two adjacent to its complement',
    tetradic: 'Four colors forming a rectangle',
    monochromatic: 'Single hue with varied intensity',
    '60-30-10': 'Dominant, secondary, and accent roles for UI layouts'
  };
  return descriptions[harmony];
}

/**
 * Tailwind grid class for the palette swatch layout
 */
export function getHarmonyLayoutClass(harmony: HarmonyType, count: number): string {
  if (harmony === '60-30-10') {
    return 'grid grid-cols-1 gap-3 sm:grid-cols-[6fr_3fr_1fr]';
  }

  switch (count) {
    case 2:
      return 'grid grid-cols-2 gap-3';
    case 3:
      return 'grid grid-cols-1 gap-3 sm:grid-cols-3';
    case 4:
      return 'grid grid-cols-2 gap-3';
    case 5:
      return 'grid grid-cols-2 gap-3 sm:grid-cols-5';
    default:
      return 'grid grid-cols-2 gap-3 sm:grid-cols-3';
  }
}
