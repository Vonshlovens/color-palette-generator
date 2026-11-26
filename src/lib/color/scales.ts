import type { Color } from '$lib/types';
import { colorFromOklch, rgbToOklch } from './oklch';

export const SHADE_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ShadeStop = (typeof SHADE_STOPS)[number];

export interface Shade {
  stop: ShadeStop;
  color: Color;
}

/** Target OKLCH lightness per stop, tuned to sit close to Tailwind's default ramps. */
const LIGHTNESS: Record<ShadeStop, number> = {
  50: 0.975,
  100: 0.94,
  200: 0.885,
  300: 0.815,
  400: 0.72,
  500: 0.63,
  600: 0.545,
  700: 0.465,
  800: 0.39,
  900: 0.31,
  950: 0.225
};

/** Chroma multiplier per stop: tints and deep shades carry less chroma than the mid ramp. */
const CHROMA: Record<ShadeStop, number> = {
  50: 0.14,
  100: 0.3,
  200: 0.52,
  300: 0.76,
  400: 0.94,
  500: 1,
  600: 0.96,
  700: 0.86,
  800: 0.72,
  900: 0.58,
  950: 0.46
};

/**
 * Generate an 11-step 50–950 ramp around a color's OKLCH hue. Lightness follows a fixed
 * perceptual ladder so ramps from different hues line up; chroma tapers toward both ends and
 * is gamut-mapped into sRGB.
 */
export function generateShadeScale(color: Color, options: { chroma?: number } = {}): Shade[] {
  const { c, h } = rgbToOklch(color.rgb);
  // Muted bases still get a usable ramp; vivid bases cap at a chroma sRGB can mostly show.
  const peak = options.chroma ?? Math.min(0.3, Math.max(c, 0));

  return SHADE_STOPS.map((stop) => ({
    stop,
    color: colorFromOklch({ l: LIGHTNESS[stop], c: peak * CHROMA[stop], h })
  }));
}

/** The stop whose lightness is closest to the given color, used to mark "you are here". */
export function nearestStop(color: Color): ShadeStop {
  const { l } = rgbToOklch(color.rgb);
  let best: ShadeStop = 500;
  let bestDistance = Infinity;
  for (const stop of SHADE_STOPS) {
    const distance = Math.abs(LIGHTNESS[stop] - l);
    if (distance < bestDistance) {
      best = stop;
      bestDistance = distance;
    }
  }
  return best;
}
