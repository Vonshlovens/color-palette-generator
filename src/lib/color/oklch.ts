import type { Color, RGB } from '$lib/types';
import { rgbToHex, rgbToHsl } from './conversions';

/** Perceptual OKLCH coordinates: L 0–1, C ≥ 0 (≈0.37 max in sRGB), H 0–360. */
export interface OKLCH {
  l: number;
  c: number;
  h: number;
}

const toLinear = (channel: number): number => {
  const v = channel / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

const fromLinear = (value: number): number => {
  const v = value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  return v * 255;
};

/** Linear-light sRGB triple (0–1, may fall outside for out-of-gamut colors). */
export function oklchToLinearRgb({ l, c, h }: OKLCH): [number, number, number] {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;

  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S
  ];
}

/** OKLab coordinates: L 0–1, a and b roughly ±0.4. */
export interface OKLab {
  l: number;
  a: number;
  b: number;
}

export function rgbToOklab(rgb: RGB): OKLab {
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363288629 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    l: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  };
}

/** Perceptual distance (ΔE OK). About 0.02 is barely noticeable; under ~0.07 reads as "same". */
export function oklabDistance(x: RGB, y: RGB): number {
  const a = rgbToOklab(x);
  const b = rgbToOklab(y);
  return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b);
}

export function rgbToOklch(rgb: RGB): OKLCH {
  const { l, a, b } = rgbToOklab(rgb);
  const c = Math.sqrt(a * a + b * b);
  // Achromatic colors have no meaningful hue; report 0 instead of float noise.
  const h = c < 1e-4 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { l, c, h };
}

function inGamut([r, g, b]: [number, number, number]): boolean {
  const e = 1e-6;
  return r >= -e && r <= 1 + e && g >= -e && g <= 1 + e && b >= -e && b <= 1 + e;
}

/**
 * Convert OKLCH to 8-bit sRGB. Out-of-gamut colors keep their lightness and hue and lose
 * chroma (binary search) until they fit, which is how CSS Color 4 recommends mapping.
 */
export function oklchToRgb(color: OKLCH): RGB {
  const l = Math.min(1, Math.max(0, color.l));
  let target = { l, c: Math.max(0, color.c), h: color.h };

  if (!inGamut(oklchToLinearRgb(target))) {
    let low = 0;
    let high = target.c;
    for (let i = 0; i < 24; i++) {
      const mid = (low + high) / 2;
      if (inGamut(oklchToLinearRgb({ ...target, c: mid }))) low = mid;
      else high = mid;
    }
    target = { ...target, c: low };
  }

  const [r, g, b] = oklchToLinearRgb(target);
  const to8 = (v: number) => Math.round(Math.min(255, Math.max(0, fromLinear(v))));
  return { r: to8(r), g: to8(g), b: to8(b) };
}

/** Build a full Color from sRGB, deriving HEX and (rounded) HSL. */
export function colorFromRgb(rgb: RGB): Color {
  return { rgb, hex: rgbToHex(rgb), hsl: rgbToHsl(rgb) };
}

export function colorFromOklch(oklch: OKLCH): Color {
  return colorFromRgb(oklchToRgb(oklch));
}

/** CSS Color 4 string, e.g. `oklch(62.8% 0.258 29.2)`. */
export function formatOklch(rgb: RGB): string {
  const { l, c, h } = rgbToOklch(rgb);
  const lightness = `${+(l * 100).toFixed(1)}%`;
  const chroma = +c.toFixed(3);
  const hue = c < 0.0005 ? 0 : +h.toFixed(1);
  return `oklch(${lightness} ${chroma} ${hue})`;
}
