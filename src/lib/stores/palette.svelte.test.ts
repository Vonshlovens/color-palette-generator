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
      harmony: 'triadic',
      lockedSwatches: []
    });
    expect(second.snapshot()).toEqual({
      hue: 220,
      saturation: 70,
      lightness: 50,
      harmony: 'complementary',
      lockedSwatches: []
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
      harmony: 'analogous',
      lockedSwatches: []
    });
    expect(store.colors).toHaveLength(3);
  });

  it('keeps locked colors fixed while the base changes', () => {
    const store = createPaletteStore({
      hue: 220,
      saturation: 70,
      lightness: 50,
      harmony: 'complementary'
    });

    const lockedHex = store.colors[1].hex;
    store.toggleLock(1);
    expect(store.isLocked(1)).toBe(true);

    store.setHue(40);
    expect(store.colors[1].hex).toBe(lockedHex);
    expect(store.colors[0].hsl.h).toBe(40);

    store.toggleLock(1);
    expect(store.isLocked(1)).toBe(false);
    expect(store.colors[1].hsl.h).toBe(220);
  });

  it('clears locks when harmony changes', () => {
    const store = createPaletteStore({
      hue: 200,
      saturation: 70,
      lightness: 50,
      harmony: 'monochromatic'
    });

    store.toggleLock(0);
    store.toggleLock(4);
    expect(store.lockedCount).toBe(2);

    store.setHarmony('60-30-10');
    expect(store.lockedCount).toBe(0);
  });

  it('clears locks on hydrate', () => {
    const store = createPaletteStore();
    store.toggleLock(0);
    expect(store.lockedCount).toBe(1);

    expect(
      store.hydrate({
        hue: 10,
        saturation: 60,
        lightness: 40,
        harmony: 'triadic'
      })
    ).toBe(true);
    expect(store.lockedCount).toBe(0);
    expect(store.selectedIndex).toBe(0);
  });

  it('edits the selected swatch and retargets the base for unlocked colors', () => {
    const store = createPaletteStore({
      hue: 220,
      saturation: 70,
      lightness: 50,
      harmony: '60-30-10'
    });

    store.selectColor(0);
    expect(store.selectedIndex).toBe(0);

    const dominant = store.colors[0].hsl;
    store.setSelectedHue((dominant.h + 40) % 360);

    expect(store.selectedColor.hsl.h).toBe((dominant.h + 40) % 360);
    // Secondary shares the dominant hue family in 60-30-10
    expect(store.colors[1].hsl.h).toBe(store.colors[0].hsl.h);
  });

  it('edits a locked swatch in place without moving unlocked siblings', () => {
    const store = createPaletteStore({
      hue: 220,
      saturation: 70,
      lightness: 50,
      harmony: 'complementary'
    });

    const originalBaseHue = store.colors[0].hsl.h;
    store.toggleLock(1);
    store.selectColor(1);
    store.setSelectedHue(40);

    expect(store.colors[1].hsl.h).toBe(40);
    expect(store.colors[0].hsl.h).toBe(originalBaseHue);
  });

  it('includes locked HSL overrides in a snapshot so saved palettes reproduce every swatch', () => {
    const store = createPaletteStore({
      hue: 220,
      saturation: 70,
      lightness: 50,
      harmony: '60-30-10'
    });

    store.toggleLock(0);
    store.selectColor(0);
    store.setSelectedHsl({ h: 25, s: 90, l: 96 });

    const snapshot = store.snapshot();
    const hydrated = createPaletteStore(snapshot);

    expect(snapshot.lockedSwatches).toEqual([{ index: 0, h: 25, s: 90, l: 96 }]);
    expect(hydrated.colors.map((color) => color.hex)).toEqual(store.colors.map((color) => color.hex));
    expect(hydrated.isLocked(0)).toBe(true);
  });

  it('preserves automatic 60-30-10 edge overrides through a snapshot', () => {
    const store = createPaletteStore({
      hue: 220,
      saturation: 70,
      lightness: 50,
      harmony: '60-30-10'
    });

    store.setSelectedHsl({ h: 25, s: 90, l: 100 });
    const hydrated = createPaletteStore(store.snapshot());

    expect(store.isLocked(0)).toBe(true);
    expect(hydrated.colors.map((color) => color.hex)).toEqual(store.colors.map((color) => color.hex));
  });

  it('resets selection when harmony changes', () => {
    const store = createPaletteStore({
      hue: 200,
      saturation: 70,
      lightness: 50,
      harmony: 'tetradic'
    });

    store.selectColor(3);
    expect(store.selectedIndex).toBe(3);

    store.setHarmony('complementary');
    expect(store.selectedIndex).toBe(0);
  });
});
