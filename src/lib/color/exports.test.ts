import { describe, expect, it } from 'vitest';
import { buildExport } from './exports';
import { generatePalette } from './harmonies';

const input = {
  name: 'Harbor <night> & "day"',
  harmony: '60-30-10' as const,
  colors: generatePalette({ h: 214, s: 48, l: 54 }, '60-30-10')
};

describe('palette exports', () => {
  it('writes CSS variables in HEX with an OKLCH upgrade', () => {
    const css = buildExport('css', input);
    expect(css).toContain(`--color-dominant: ${input.colors[0].hex};`);
    expect(css).toContain(`--color-accent: ${input.colors[2].hex};`);
    expect(css).toMatch(/@supports \(color: oklch\(0% 0 0\)\)[\s\S]*--color-accent: oklch\(/);
  });

  it('writes a Tailwind v4 @theme with an 11-step scale per color', () => {
    const theme = buildExport('tailwind', input);
    expect(theme).toContain('@theme {');
    for (const token of ['dominant', 'secondary', 'accent']) {
      for (const stop of [50, 500, 950]) {
        expect(theme).toMatch(new RegExp(`--color-${token}-${stop}: oklch\\(`));
      }
    }
    expect(theme.match(/--color-accent-\d+:/g)).toHaveLength(11);
  });

  it('writes valid DTCG JSON tokens', () => {
    const tokens = JSON.parse(buildExport('json', input));
    expect(tokens.color.accent.$type).toBe('color');
    expect(tokens.color.accent.$value).toBe(input.colors[2].hex);
    expect(tokens.color.accent['500'].$extensions.oklch).toMatch(/^oklch\(/);
  });

  it('writes SCSS variables and a map', () => {
    const scss = buildExport('scss', input);
    expect(scss).toContain(`$color-secondary: ${input.colors[1].hex};`);
    expect(scss).toContain(`'secondary': $color-secondary,`);
  });

  it('escapes the palette name in the SVG card', () => {
    const svg = buildExport('svg', input);
    expect(svg).toContain('Harbor &lt;night&gt; &amp; &quot;day&quot;');
    expect(svg).not.toContain('<night>');
    expect(svg.match(/<rect /g)).toHaveLength(4);
  });
});
