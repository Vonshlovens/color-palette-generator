import { describe, expect, it } from 'vitest';
import { generatePalette } from '$lib/color/harmonies';
import type { PaletteRecord } from '$lib/server/db';
import { canManagePalette, toSavedPalette } from './mapping';

const record: PaletteRecord = {
  id: '3d9945b5-9363-43a3-9245-f0a67c5a1062',
  slug: 'Abcdef123456',
  name: 'Ocean Sunset',
  hue: 210,
  saturation: 70,
  lightness: 50,
  harmony: 'triadic',
  colors: [
    { h: 210, s: 70, l: 50 },
    { h: 12, s: 80, l: 60 },
    { h: 90, s: 40, l: 30 }
  ],
  createdBy: 'user-1',
  createdAt: new Date('2026-01-02T03:04:05.000Z'),
  updatedAt: new Date('2026-02-03T04:05:06.000Z')
};

describe('toSavedPalette', () => {
  it('maps database values, keeping the exact swatches and omitting the ID and creator', () => {
    const dto = toSavedPalette(record);

    expect(dto).toEqual({
      slug: 'Abcdef123456',
      name: 'Ocean Sunset',
      hue: 210,
      saturation: 70,
      lightness: 50,
      harmony: 'triadic',
      colors: record.colors,
      canManage: false,
      createdAt: '2026-01-02T03:04:05.000Z',
      updatedAt: '2026-02-03T04:05:06.000Z'
    });
    expect(dto).not.toHaveProperty('id');
    expect(dto).not.toHaveProperty('createdBy');
  });

  it('derives swatches for rows saved before exact colors were stored', () => {
    const dto = toSavedPalette({ ...record, colors: null });
    expect(dto.colors).toEqual(
      generatePalette({ h: 210, s: 70, l: 50 }, 'triadic').map((color) => color.hsl)
    );
  });
});

describe('canManagePalette', () => {
  it('allows the creator and the owner, and nobody else', () => {
    expect(canManagePalette(record, { id: 'user-1', isOwner: false })).toBe(true);
    expect(canManagePalette(record, { id: 'owner', isOwner: true })).toBe(true);
    expect(canManagePalette(record, { id: 'user-2', isOwner: false })).toBe(false);
    expect(canManagePalette(record, null)).toBe(false);
    // A palette whose creator was deleted belongs to nobody but the owner.
    expect(canManagePalette({ createdBy: null }, { id: 'user-1', isOwner: false })).toBe(false);
    expect(canManagePalette({ createdBy: null }, { id: 'owner', isOwner: true })).toBe(true);
  });
});
