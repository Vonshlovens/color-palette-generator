import type { Color, PaletteKind } from '$lib/types';
import { getContrastTextColor } from './conversions';
import { getHarmonyName, getSwatchLabel, getSwatchTokenName } from './harmonies';
import { formatOklch } from './oklch';
import { generateShadeScale } from './scales';

export const EXPORT_FORMATS = ['css', 'tailwind', 'json', 'scss', 'svg'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const EXPORT_FORMAT_INFO: Record<
  ExportFormat,
  { label: string; filename: string; mime: string; description: string }
> = {
  css: {
    label: 'CSS',
    filename: 'palette.css',
    mime: 'text/css',
    description: 'Custom properties in HEX, upgraded to OKLCH where browsers support it.'
  },
  tailwind: {
    label: 'Tailwind v4',
    filename: 'palette.theme.css',
    mime: 'text/css',
    description: 'An @theme block with a 50–950 OKLCH scale for every color.'
  },
  json: {
    label: 'JSON tokens',
    filename: 'palette.tokens.json',
    mime: 'application/json',
    description: 'W3C Design Tokens (DTCG) format with HEX values and OKLCH extensions.'
  },
  scss: {
    label: 'SCSS',
    filename: '_palette.scss',
    mime: 'text/x-scss',
    description: 'Sass variables plus a $palette map for loops and functions.'
  },
  svg: {
    label: 'SVG card',
    filename: 'palette.svg',
    mime: 'image/svg+xml',
    description: 'A 1200×630 palette card for decks, docs, and social posts.'
  }
};

export interface ExportInput {
  name: string;
  harmony: PaletteKind;
  colors: Color[];
}

interface Slot {
  token: string;
  label: string;
  color: Color;
}

function slots({ harmony, colors }: ExportInput): Slot[] {
  return colors.map((color, index) => ({
    token: getSwatchTokenName(harmony, index),
    label: getSwatchLabel(harmony, index),
    color
  }));
}

/** Comment title, without repeating the harmony when the name already says it. */
function title({ name, harmony }: ExportInput): string {
  const harmonyName = getHarmonyName(harmony);
  return name.toLowerCase().includes(harmonyName.toLowerCase()) ? name : `${name} · ${harmonyName}`;
}

function toCss(input: ExportInput): string {
  const items = slots(input);
  const hex = items.map(({ token, color }) => `  --color-${token}: ${color.hex};`).join('\n');
  const oklch = items
    .map(({ token, color }) => `    --color-${token}: ${formatOklch(color.rgb)};`)
    .join('\n');

  return `/* ${title(input)} */
:root {
${hex}
}

@supports (color: oklch(0% 0 0)) {
  :root {
${oklch}
  }
}
`;
}

function toTailwind(input: ExportInput): string {
  const blocks = slots(input).map(({ token, label, color }) => {
    const scale = generateShadeScale(color)
      .map(({ stop, color: shade }) => `  --color-${token}-${stop}: ${formatOklch(shade.rgb)};`)
      .join('\n');
    return `  /* ${label} ${color.hex} */\n  --color-${token}: ${formatOklch(color.rgb)};\n${scale}`;
  });

  return `@import "tailwindcss";

/* ${title(input)} */
@theme {
${blocks.join('\n\n')}
}
`;
}

function toJson(input: ExportInput): string {
  const color: Record<string, unknown> = {};

  for (const { token, label, color: base } of slots(input)) {
    const group: Record<string, unknown> = {
      $type: 'color',
      $description: label,
      $value: base.hex,
      $extensions: {
        oklch: formatOklch(base.rgb),
        rgb: base.rgb,
        hsl: base.hsl
      }
    };
    for (const { stop, color: shade } of generateShadeScale(base)) {
      group[stop] = {
        $type: 'color',
        $value: shade.hex,
        $extensions: { oklch: formatOklch(shade.rgb) }
      };
    }
    color[token] = group;
  }

  return `${JSON.stringify(
    {
      $description: `${input.name} (${getHarmonyName(input.harmony)})`,
      color
    },
    null,
    2
  )}\n`;
}

function toScss(input: ExportInput): string {
  const items = slots(input);
  const variables = items.map(({ token, color }) => `$color-${token}: ${color.hex};`).join('\n');
  const map = items.map(({ token }) => `  '${token}': $color-${token},`).join('\n');

  return `// ${title(input)}
${variables}

$palette: (
${map}
);
`;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char] ?? char
  );
}

function toSvg(input: ExportInput): string {
  const width = 1200;
  const height = 630;
  const pad = 56;
  const gap = 12;
  const top = 150;
  const items = slots(input);
  const chipWidth = (width - pad * 2 - gap * (items.length - 1)) / items.length;
  const chipHeight = height - top - pad;
  const font = "'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif";
  const mono = "'Geist Mono', ui-monospace, Menlo, monospace";

  const chips = items
    .map(({ label, color }, index) => {
      const x = pad + index * (chipWidth + gap);
      const ink = getContrastTextColor(color.rgb) === 'dark' ? '#1c1c1c' : '#ffffff';
      const textX = x + 22;
      return `  <g>
    <rect x="${x.toFixed(1)}" y="${top}" width="${chipWidth.toFixed(1)}" height="${chipHeight}" rx="20" fill="${color.hex}"/>
    <text x="${textX.toFixed(1)}" y="${top + 38}" fill="${ink}" font-family="${font}" font-size="18" opacity="0.8">${escapeXml(label)}</text>
    <text x="${textX.toFixed(1)}" y="${top + chipHeight - 56}" fill="${ink}" font-family="${mono}" font-size="26" font-weight="600">${color.hex.toUpperCase()}</text>
    <text x="${textX.toFixed(1)}" y="${top + chipHeight - 26}" fill="${ink}" font-family="${mono}" font-size="15" opacity="0.75">${escapeXml(formatOklch(color.rgb))}</text>
  </g>`;
    })
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(input.name)} color palette">
  <rect width="${width}" height="${height}" fill="#ececec"/>
  <text x="${pad}" y="96" fill="#1c1c1c" font-family="${font}" font-size="48" font-weight="600" letter-spacing="-1">${escapeXml(input.name)}</text>
  <text x="${width - pad}" y="96" fill="#5c5c5c" font-family="${font}" font-size="20" text-anchor="end">${escapeXml(getHarmonyName(input.harmony))} ${input.harmony === 'freeform' ? 'palette' : 'harmony'}</text>
${chips}
</svg>
`;
}

export function buildExport(format: ExportFormat, input: ExportInput): string {
  switch (format) {
    case 'css':
      return toCss(input);
    case 'tailwind':
      return toTailwind(input);
    case 'json':
      return toJson(input);
    case 'scss':
      return toScss(input);
    case 'svg':
      return toSvg(input);
  }
}
