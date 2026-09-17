import { describe, expect, it } from 'vitest';
import type { PaletteRecord } from '$lib/server/db';
import { toSavedPalette } from './mapping';

describe('toSavedPalette', () => {
  it('maps database values while omitting the internal ID', () => {
    const record: PaletteRecord = {
      id: '3d9945b5-9363-43a3-9245-f0a67c5a1062',
      slug: 'Abcdef123456',
      name: 'Ocean Sunset',
      hue: 210,
      saturation: 70,
      lightness: 50,
      harmony: 'triadic',
      lockedSwatches: [{ index: 2, h: 330, s: 80, l: 45 }],
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
      updatedAt: new Date('2026-02-03T04:05:06.000Z')
    };

    const dto = toSavedPalette(record);

    expect(dto).toEqual({
      slug: 'Abcdef123456',
      name: 'Ocean Sunset',
      hue: 210,
      saturation: 70,
      lightness: 50,
      harmony: 'triadic',
      lockedSwatches: [{ index: 2, h: 330, s: 80, l: 45 }],
      createdAt: '2026-01-02T03:04:05.000Z',
      updatedAt: '2026-02-03T04:05:06.000Z'
    });
    expect(dto).not.toHaveProperty('id');
  });
});
