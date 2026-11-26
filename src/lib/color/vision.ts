import type { RGB } from '$lib/types';
import { oklabDistance } from './oklch';

export const CVD_TYPES = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as const;
export type CvdType = (typeof CVD_TYPES)[number];

export const CVD_INFO: Record<CvdType, { name: string; short: string; description: string }> = {
  protanopia: {
    name: 'Protanopia',
    short: 'Protan',
    description: 'No red cones. Reds darken and merge with greens. About 1% of men.'
  },
  deuteranopia: {
    name: 'Deuteranopia',
    short: 'Deutan',
    description: 'No green cones. The most common form; reds and greens converge. About 1% of men.'
  },
  tritanopia: {
    name: 'Tritanopia',
    short: 'Tritan',
    description: 'No blue cones. Blues shift toward teal and yellows toward pink. Rare.'
  },
  achromatopsia: {
    name: 'Achromatopsia',
    short: 'Mono',
    description: 'No color vision. Only lightness differences remain, so contrast does the work.'
  }
};

/**
 * Row-major 3×3 matrices applied in linear-light sRGB. Dichromacy matrices are from
 * Machado, Oliveira & Fernandes (2009) at severity 1.0; achromatopsia uses Rec. 709 luminance.
 * Every row sums to 1, so white and black are preserved.
 */
export const CVD_MATRICES: Record<CvdType, readonly number[]> = {
  protanopia: [
    0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998
  ],
  deuteranopia: [
    0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881
  ],
  tritanopia: [
    1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039
  ],
  achromatopsia: [0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722]
};

const toLinear = (channel: number): number => {
  const v = channel / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const fromLinear = (value: number): number => {
  const v = Math.min(1, Math.max(0, value));
  const s = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return Math.round(s * 255);
};

/** Simulate how an sRGB color appears with the given color-vision deficiency. */
export function simulateCvd(rgb: RGB, type: CvdType): RGB {
  const m = CVD_MATRICES[type];
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  return {
    r: fromLinear(m[0] * r + m[1] * g + m[2] * b),
    g: fromLinear(m[3] * r + m[4] * g + m[5] * b),
    b: fromLinear(m[6] * r + m[7] * g + m[8] * b)
  };
}

/** `values` for an SVG feColorMatrix (4×5, linearRGB) that applies the same simulation. */
export function cvdFilterValues(type: CvdType): string {
  const m = CVD_MATRICES[type];
  return [
    m[0], m[1], m[2], 0, 0,
    m[3], m[4], m[5], 0, 0,
    m[6], m[7], m[8], 0, 0,
    0, 0, 0, 1, 0
  ].join(' ');
}

/** Below this ΔE OK, two swatches read as the same color at a glance. */
export const CONFUSABLE_DISTANCE = 0.06;

/**
 * Index pairs that stay distinct for typical vision but become hard to tell apart under `type`.
 * Pairs that were already close for typical vision are left out, since CVD did not cause them.
 */
export function findConfusablePairs(colors: RGB[], type: CvdType): [number, number][] {
  const simulated = colors.map((color) => simulateCvd(color, type));
  const pairs: [number, number][] = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      if (
        oklabDistance(colors[i], colors[j]) >= CONFUSABLE_DISTANCE &&
        oklabDistance(simulated[i], simulated[j]) < CONFUSABLE_DISTANCE
      ) {
        pairs.push([i, j]);
      }
    }
  }
  return pairs;
}
