import { afterEach, describe, expect, it, vi } from 'vitest';
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
