import { describe, expect, it } from 'vitest';
import { createFreeformStore, randomHsl } from './freeform.svelte';

/** A deterministic random source cycling through the given values. */
function sequence(...values: number[]) {
  let index = 0;
  return () => values[index++ % values.length];
}

describe('FreeformStore', () => {
  it('randomizes every unlocked swatch and leaves locked ones exactly as they were', () => {
    const store = createFreeformStore({
      harmony: 'freeform',
      colors: [
        { h: 10, s: 20, l: 30 },
        { h: 40, s: 50, l: 60 },
        { h: 70, s: 80, l: 90 }
      ]
    });
    store.toggleLock(1);
    store.randomize(sequence(0.5, 0.25, 0.75));

    expect(store.colors.map((color) => color.hsl)).toEqual([
      { h: 180, s: 25, l: 75 },
      { h: 40, s: 50, l: 60 },
      { h: 180, s: 25, l: 75 }
    ]);
  });

  it('draws from the whole HSL range, not a harmony-friendly band', () => {
    expect(randomHsl(() => 0)).toEqual({ h: 0, s: 0, l: 0 });
    expect(randomHsl(() => 0.9999)).toEqual({ h: 359, s: 100, l: 100 });
  });

  it('adds up to seven swatches and removes down to one', () => {
    const store = createFreeformStore({ harmony: 'freeform', colors: [{ h: 1, s: 1, l: 1 }] });
    expect(store.canRemove).toBe(false);
    store.removeColor(0);
    expect(store.colors).toHaveLength(1);

    for (let i = 0; i < 10; i += 1) store.addColor();
    expect(store.colors).toHaveLength(7);
    expect(store.canAdd).toBe(false);
    expect(store.selectedIndex).toBe(6);

    for (let i = 0; i < 10; i += 1) store.removeColor(0);
    expect(store.colors).toHaveLength(1);
  });

  it('shifts locks and selection down when an earlier swatch is removed', () => {
    const store = createFreeformStore({
      harmony: 'freeform',
      colors: [
        { h: 1, s: 1, l: 1 },
        { h: 2, s: 2, l: 2 },
        { h: 3, s: 3, l: 3 },
        { h: 4, s: 4, l: 4 }
      ]
    });
    store.toggleLock(0);
    store.toggleLock(3);
    store.selectColor(3);
    store.removeColor(0);

    expect(store.colors.map((color) => color.hsl.h)).toEqual([2, 3, 4]);
    expect([0, 1, 2].map((i) => store.isLocked(i))).toEqual([false, false, true]);
    expect(store.selectedColor.hsl.h).toBe(4);
  });

  it('edits only the selected swatch and undoes shuffles, edits, and removals in order', () => {
    const store = createFreeformStore({
      harmony: 'freeform',
      colors: [
        { h: 1, s: 1, l: 1 },
        { h: 2, s: 2, l: 2 }
      ]
    });
    store.selectColor(1);
    store.setSelectedHue(200);
    expect(store.colors.map((color) => color.hsl.h)).toEqual([1, 200]);

    store.randomize(sequence(0.5));
    store.removeColor(0);
    expect(store.colors).toHaveLength(1);

    store.undo();
    expect(store.colors.map((color) => color.hsl.h)).toEqual([180, 180]);
    store.undo();
    expect(store.colors.map((color) => color.hsl.h)).toEqual([1, 200]);
    store.undo();
    expect(store.colors.map((color) => color.hsl.h)).toEqual([1, 2]);
    expect(store.canUndo).toBe(false);
    store.redo();
    expect(store.colors.map((color) => color.hsl.h)).toEqual([1, 200]);
  });

  it('snapshots exactly what is on screen and refuses invalid snapshots', () => {
    const colors = [
      { h: 5, s: 6, l: 7 },
      { h: 300, s: 100, l: 0 }
    ];
    const store = createFreeformStore({ harmony: 'freeform', colors });
    expect(store.snapshot()).toEqual({ harmony: 'freeform', colors });

    expect(store.hydrate({ harmony: 'freeform', colors: [] })).toBe(false);
    expect(store.hydrate({ harmony: 'freeform', colors: Array(8).fill(colors[0]) })).toBe(false);
    expect(store.hydrate({ harmony: 'freeform', colors: [{ h: 400, s: 0, l: 0 }] })).toBe(false);
    expect(store.snapshot().colors).toEqual(colors);
  });
});
