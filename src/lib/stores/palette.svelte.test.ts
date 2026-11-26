import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPaletteStore } from './palette.svelte';

describe('createPaletteStore', () => {
  it('creates independent stores with default state', () => {
    const first = createPaletteStore();
    const second = createPaletteStore();

    first.setHue(42);
    first.setHarmony('triadic');

    expect(first.snapshot()).toMatchObject({
      hue: 42,
      saturation: 70,
      lightness: 50,
      harmony: 'triadic'
    });
    expect(second.snapshot()).toMatchObject({
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

    expect(store.snapshot()).toMatchObject({
      hue: 15,
      saturation: 80,
      lightness: 35,
      harmony: 'analogous'
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

  describe('exact swatches', () => {
    it('snapshots the on-screen swatches, not the regenerated seed palette', () => {
      // Eric's bug: blues were locked, then the seed hue moved to green. The old snapshot held
      // only the seed, so the saved palette came back green.
      const store = createPaletteStore({ hue: 214, saturation: 70, lightness: 50, harmony: 'monochromatic' });
      for (const index of [0, 1, 2, 3, 4]) store.toggleLock(index);
      const blues = store.colors.map((color) => color.hsl);
      store.setHue(99);

      const snapshot = store.snapshot();
      expect(snapshot.hue).toBe(99);
      expect(snapshot.colors).toEqual(blues);
      expect(blues.every((hsl) => hsl.h === 214)).toBe(true);
    });

    it('keeps a lightness nudge that the harmony cannot reproduce', () => {
      const store = createPaletteStore({ hue: 220, saturation: 70, lightness: 50, harmony: 'monochromatic' });
      store.selectColor(2);
      store.setSelectedLightness(store.selectedColor.hsl.l + 4);
      expect(store.snapshot().colors?.[2]).toEqual({ h: 220, s: 100, l: 54 });
    });

    it('restores exact swatches from a snapshot, locking the ones the seed would change', () => {
      const colors = [
        { h: 214, s: 90, l: 25 },
        { h: 99, s: 85, l: 40 },
        { h: 99, s: 100, l: 50 },
        { h: 99, s: 70, l: 65 },
        { h: 99, s: 50, l: 80 }
      ];
      const store = createPaletteStore();
      expect(store.load({ hue: 99, saturation: 93, lightness: 50, harmony: 'monochromatic', colors })).toBe(true);

      expect(store.colors.map((color) => color.hsl)).toEqual(colors);
      expect([0, 1, 2, 3, 4].map((i) => store.isLocked(i))).toEqual([true, false, false, false, false]);
    });

    it('refuses snapshots whose swatch count does not match the harmony', () => {
      const store = createPaletteStore();
      expect(
        store.hydrate({ hue: 1, saturation: 2, lightness: 3, harmony: 'triadic', colors: [{ h: 1, s: 2, l: 3 }] })
      ).toBe(false);
      expect(store.harmony).toBe('complementary');
    });
  });

  describe('history', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('undoes and redoes harmony, lock, and shuffle edits in order', () => {
      const store = createPaletteStore();
      store.setHarmony('triadic');
      store.toggleLock(2);
      store.randomize();

      store.undo();
      expect(store.snapshot()).toMatchObject({ hue: 220, harmony: 'triadic' });
      expect(store.isLocked(2)).toBe(true);
      store.undo();
      expect(store.isLocked(2)).toBe(false);
      store.undo();
      expect(store.harmony).toBe('complementary');
      expect(store.canUndo).toBe(false);

      store.redo();
      store.redo();
      expect(store.harmony).toBe('triadic');
      expect(store.isLocked(2)).toBe(true);
    });

    it('collapses a quick slider drag into one undo step', () => {
      vi.useFakeTimers();
      const store = createPaletteStore();
      for (const hue of [221, 225, 232, 240]) {
        store.setSelectedHue(hue);
        vi.advanceTimersByTime(50);
      }
      vi.advanceTimersByTime(1000);
      store.setSelectedHue(300);

      store.undo();
      expect(store.hue).toBe(240);
      store.undo();
      expect(store.hue).toBe(220);
      expect(store.canUndo).toBe(false);
    });

    it('drops the redo stack after a new edit', () => {
      const store = createPaletteStore();
      store.setHarmony('analogous');
      store.undo();
      expect(store.canRedo).toBe(true);
      store.setHarmony('tetradic');
      expect(store.canRedo).toBe(false);
    });

    it('does not record edits that change nothing', () => {
      const store = createPaletteStore();
      store.setHarmony('complementary');
      store.setSelectedHue(store.selectedColor.hsl.h);
      expect(store.canUndo).toBe(false);
    });

    it('loads a preset as an undoable step', () => {
      const store = createPaletteStore();
      store.toggleLock(1);
      expect(store.load({ hue: 40, saturation: 90, lightness: 52, harmony: 'split-complementary' })).toBe(true);
      expect(store.lockedCount).toBe(0);
      store.undo();
      expect(store.snapshot()).toMatchObject({ hue: 220, harmony: 'complementary' });
      expect(store.isLocked(1)).toBe(true);
    });
  });
});
