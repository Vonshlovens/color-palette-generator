import { describe, expect, it } from 'vitest';
import { generatePalette } from '$lib/color/harmonies';
import {
  createPaletteSchema,
  listPalettesQuerySchema,
  paletteSlugSchema,
  renamePaletteSchema
} from './validation';

const validPalette = {
  name: 'Ocean Sunset',
  hue: 210,
  saturation: 70,
  lightness: 50,
  harmony: 'triadic'
};

describe('createPaletteSchema', () => {
  it('trims names and accepts inclusive channel bounds', () => {
    expect(
      createPaletteSchema.parse({
        ...validPalette,
        name: '  Ocean Sunset  ',
        hue: 0,
        saturation: 100,
        lightness: 0
      })
    ).toMatchObject({
      ...validPalette,
      name: 'Ocean Sunset',
      hue: 0,
      saturation: 100,
      lightness: 0
    });

    expect(createPaletteSchema.safeParse({ ...validPalette, hue: 360 }).success).toBe(true);
  });

  it.each(['', '   ', 'x'.repeat(81)])('rejects invalid name %o', (name) => {
    expect(createPaletteSchema.safeParse({ ...validPalette, name }).success).toBe(false);
  });

  it.each([
    ['hue', -1],
    ['hue', 361],
    ['saturation', -1],
    ['saturation', 101],
    ['lightness', -1],
    ['lightness', 101]
  ])('rejects %s outside its bounds', (channel, value) => {
    expect(
      createPaletteSchema.safeParse({ ...validPalette, [channel]: value }).success
    ).toBe(false);
  });

  it('rejects non-finite channels and unsupported harmonies', () => {
    expect(createPaletteSchema.safeParse({ ...validPalette, hue: Number.NaN }).success).toBe(false);
    expect(createPaletteSchema.safeParse({ ...validPalette, harmony: 'square' }).success).toBe(false);
  });

  it('rejects unknown request properties', () => {
    expect(createPaletteSchema.safeParse({ ...validPalette, id: 'internal' }).success).toBe(false);
  });
});

describe('createPaletteSchema colors', () => {
  const swatch = (h: number) => ({ h, s: 50, l: 50 });

  it('keeps the exact swatches sent with a harmony palette', () => {
    const colors = [swatch(1), swatch(2), swatch(3)];
    expect(createPaletteSchema.parse({ ...validPalette, colors }).colors).toEqual(colors);
  });

  it('generates swatches for clients that send only the seed', () => {
    expect(createPaletteSchema.parse(validPalette).colors).toEqual(
      generatePalette({ h: 210, s: 70, l: 50 }, 'triadic').map((color) => color.hsl)
    );
  });

  it('rejects a swatch count that does not match the harmony', () => {
    const result = createPaletteSchema.safeParse({ ...validPalette, colors: [swatch(1), swatch(2)] });
    expect(result.success).toBe(false);
  });

  it('accepts one to seven freeform swatches and seeds from the first', () => {
    for (const count of [1, 7]) {
      const colors = Array.from({ length: count }, (_, i) => swatch(i * 40 + 5));
      expect(createPaletteSchema.parse({ name: 'Free', harmony: 'freeform', colors })).toEqual({
        name: 'Free',
        harmony: 'freeform',
        colors,
        hue: 5,
        saturation: 50,
        lightness: 50
      });
    }
  });

  it.each([0, 8])('rejects %i freeform swatches', (count) => {
    const colors = Array.from({ length: count }, (_, i) => swatch(i));
    expect(createPaletteSchema.safeParse({ name: 'Free', harmony: 'freeform', colors }).success).toBe(false);
  });

  it('rejects freeform palettes without colors, with seed fields, or with bad channels', () => {
    expect(createPaletteSchema.safeParse({ name: 'Free', harmony: 'freeform' }).success).toBe(false);
    expect(
      createPaletteSchema.safeParse({ name: 'Free', harmony: 'freeform', hue: 3, colors: [swatch(1)] }).success
    ).toBe(false);
    expect(
      createPaletteSchema.safeParse({ name: 'Free', harmony: 'freeform', colors: [{ h: 1, s: 101, l: 5 }] })
        .success
    ).toBe(false);
  });
});

describe('renamePaletteSchema', () => {
  it('trims names and rejects empty, long, or extra fields', () => {
    expect(renamePaletteSchema.parse({ name: '  Blues  ' })).toEqual({ name: 'Blues' });
    expect(renamePaletteSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(renamePaletteSchema.safeParse({ name: 'x'.repeat(81) }).success).toBe(false);
    expect(renamePaletteSchema.safeParse({ name: 'ok', hue: 4 }).success).toBe(false);
  });
});

describe('paletteSlugSchema', () => {
  it.each(['Abcdef12', 'palette_slug-123', 'x'.repeat(32)])('accepts valid slug %o', (slug) => {
    expect(paletteSlugSchema.safeParse(slug).success).toBe(true);
  });

  it.each(['short', 'x'.repeat(33), 'contains space', 'contains.dot', '../escape'])(
    'rejects invalid slug %o',
    (slug) => {
      expect(paletteSlugSchema.safeParse(slug).success).toBe(false);
    }
  );
});

describe('listPalettesQuerySchema', () => {
  it('applies defaults when parameters are absent', () => {
    expect(listPalettesQuerySchema.parse({})).toEqual({ limit: 24, offset: 0 });
  });

  it('coerces numeric strings from the query string', () => {
    expect(listPalettesQuerySchema.parse({ limit: '10', offset: '30' })).toEqual({
      limit: 10,
      offset: 30
    });
  });

  it.each([
    ['limit', '0'],
    ['limit', '51'],
    ['limit', '-1'],
    ['limit', '2.5'],
    ['limit', 'abc'],
    ['offset', '-1'],
    ['offset', '10001'],
    ['offset', '1.5'],
    ['offset', 'abc']
  ])('rejects invalid %s %o', (field, value) => {
    expect(listPalettesQuerySchema.safeParse({ [field]: value }).success).toBe(false);
  });
});
