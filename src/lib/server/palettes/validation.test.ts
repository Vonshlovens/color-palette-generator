import { describe, expect, it } from 'vitest';
import { createPaletteSchema, listPalettesQuerySchema, paletteSlugSchema } from './validation';

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
    ).toEqual({
      ...validPalette,
      name: 'Ocean Sunset',
      hue: 0,
      saturation: 100,
      lightness: 0,
      lockedSwatches: []
    });

    expect(createPaletteSchema.safeParse({ ...validPalette, hue: 360 }).success).toBe(true);
    expect(createPaletteSchema.parse(validPalette).lockedSwatches).toEqual([]);
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

  it('accepts valid locked swatch HSL overrides', () => {
    expect(
      createPaletteSchema.parse({
        ...validPalette,
        lockedSwatches: [{ index: 2, h: 330, s: 80, l: 45 }]
      }).lockedSwatches
    ).toEqual([{ index: 2, h: 330, s: 80, l: 45 }]);
  });

  it('rejects duplicate or out-of-range locked swatch indexes', () => {
    expect(
      createPaletteSchema.safeParse({
        ...validPalette,
        lockedSwatches: [
          { index: 0, h: 10, s: 20, l: 30 },
          { index: 0, h: 20, s: 30, l: 40 }
        ]
      }).success
    ).toBe(false);
    expect(
      createPaletteSchema.safeParse({
        ...validPalette,
        harmony: 'complementary',
        lockedSwatches: [{ index: 2, h: 10, s: 20, l: 30 }]
      }).success
    ).toBe(false);
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
