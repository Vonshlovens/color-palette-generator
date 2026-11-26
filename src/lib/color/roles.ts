import type { Color, PaletteKind } from '$lib/types';
import { getContrastRatio } from './conversions';
import { generateShadeScale } from './scales';

export type PreviewMode = 'light' | 'dark';

/** Interface roles derived from a palette, as HEX strings, for the live previews. */
export interface UiRoles {
  canvas: string;
  surface: string;
  ink: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  accent: string;
  onAccent: string;
  /** Every palette color in order, for charts and data marks. */
  series: string[];
}

function pickInk(background: Color, candidates: Color[]): string {
  let best = candidates[0];
  let bestRatio = 0;
  for (const candidate of candidates) {
    const ratio = getContrastRatio(candidate.rgb, background.rgb);
    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
  }
  return best.hex;
}

/**
 * Map a palette onto UI roles. 60-30-10 keeps its explicit dominant / secondary / accent roles;
 * other harmonies get a neutral ramp tinted by the anchor color, with palette colors as the
 * primary, secondary, and accent brand roles.
 */
export function deriveUiRoles(colors: Color[], harmony: PaletteKind, mode: PreviewMode): UiRoles {
  const isRule = harmony === '60-30-10';
  const isMono = harmony === 'monochromatic';
  const last = colors.length - 1;

  // In 60-30-10 the accent is reserved for calls to action, so structure uses the secondary.
  // In dark mode the canvas is a deep secondary, so the light dominant takes over structure.
  const primary = isRule ? colors[mode === 'light' ? 1 : 0] : isMono ? colors[2] : colors[0];
  const accent = isRule ? colors[2] : isMono ? colors[3] : colors[last];
  // Two-color palettes have no middle color, so the secondary role is a deep shade of primary.
  const secondary = isRule
    ? colors[1]
    : isMono
      ? colors[0]
      : colors.length > 2
        ? colors[1]
        : generateShadeScale(primary)[8].color;
  const anchor = isRule ? colors[1] : primary;

  const neutral = generateShadeScale(anchor, { chroma: 0.022 });
  const n = (stop: number) => neutral.find((shade) => shade.stop === stop)!.color;

  let canvas: Color;
  let surface: Color;
  if (isRule) {
    const dominant = generateShadeScale(colors[0]);
    const deep = generateShadeScale(colors[1]);
    canvas = mode === 'light' ? colors[0] : deep[10].color;
    surface = mode === 'light' ? dominant[0].color : deep[9].color;
  } else {
    canvas = mode === 'light' ? n(100) : n(950);
    surface = mode === 'light' ? n(50) : n(900);
  }

  const inks = [n(950), n(50)];
  const white = { ...n(50), hex: '#ffffff', rgb: { r: 255, g: 255, b: 255 } };
  const onColor = (color: Color) => pickInk(color, [n(950), white]);

  return {
    canvas: canvas.hex,
    surface: surface.hex,
    ink: pickInk(canvas, inks),
    primary: primary.hex,
    onPrimary: onColor(primary),
    secondary: secondary.hex,
    onSecondary: onColor(secondary),
    accent: accent.hex,
    onAccent: onColor(accent),
    series: colors.map((color) => color.hex)
  };
}

/** CSS custom properties for a preview root, consumed as `bg-(--p-canvas)` etc. */
export function uiRoleStyle(roles: UiRoles): string {
  return [
    `--p-canvas: ${roles.canvas}`,
    `--p-surface: ${roles.surface}`,
    `--p-ink: ${roles.ink}`,
    `--p-muted: color-mix(in oklab, ${roles.ink} 62%, ${roles.canvas})`,
    `--p-line: color-mix(in oklab, ${roles.ink} 14%, transparent)`,
    `--p-primary: ${roles.primary}`,
    `--p-on-primary: ${roles.onPrimary}`,
    `--p-secondary: ${roles.secondary}`,
    `--p-on-secondary: ${roles.onSecondary}`,
    `--p-accent: ${roles.accent}`,
    `--p-on-accent: ${roles.onAccent}`
  ].join('; ');
}
