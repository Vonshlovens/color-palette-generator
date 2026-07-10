import { describe, expect, it } from 'vitest';
import { createPaletteStore } from './palette.svelte';

describe('createPaletteStore', () => {
  it('creates independent stores with default state', () => {
    const first = createPaletteStore();
    const second = createPaletteStore();

    first.setHue(42);
    first.setHarmony('triadic');

    expect(first.snapshot()).toEqual({
      hue: 42,
      saturation: 70,
      lightness: 50,
      harmony: 'triadic'
    });
    expect(second.snapshot()).toEqual({
      hue: 220,
      saturation: 70,
      lightness: 50,
      harmony: 'complementary'
    });
  });

  it('initializes synchronously from a snapshot', () => {
    const store = createPaletteStore({
      hue: 15,
      saturation: 80,
      lightness: 35,
      harmony: 'analogous'
    });

    expect(store.snapshot()).toEqual({
      hue: 15,
      saturation: 80,
      lightness: 35,
      harmony: 'analogous'
    });
    expect(store.colors).toHaveLength(5);
  });
});
