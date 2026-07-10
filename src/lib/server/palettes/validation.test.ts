import { describe, expect, it } from 'vitest';
import { createPaletteSchema, paletteSlugSchema } from './validation';

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
