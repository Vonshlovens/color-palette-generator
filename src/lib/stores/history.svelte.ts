/** Edits with the same key inside this window collapse into one undo step (e.g. a slider drag). */
const COALESCE_MS = 700;
const HISTORY_LIMIT = 100;

/** Undo/redo stacks of store states, shared by the harmony studio and freeform stores. */
export class EditHistory<T> {
  #past = $state<T[]>([]);
  #future = $state<T[]>([]);
  #lastKey: string | null = null;
  #lastTime = 0;
  #capture: () => T;
  #restore: (entry: T) => void;

  constructor(capture: () => T, restore: (entry: T) => void) {
    this.#capture = capture;
    this.#restore = restore;
  }

  get canUndo(): boolean {
    return this.#past.length > 0;
  }

  get canRedo(): boolean {
    return this.#future.length > 0;
  }

  /**
   * Push the current state onto the undo stack before a change. Repeated edits with the same
   * key in quick succession share one entry, so a slider drag undoes in a single step.
   */
  record(key?: string): void {
    const now = Date.now();
    if (key && key === this.#lastKey && now - this.#lastTime < COALESCE_MS) {
      this.#lastTime = now;
      return;
    }
    this.push(this.#capture());
    this.#lastKey = key ?? null;
    this.#lastTime = now;
  }

  /** Push a state captured earlier, for changes that must validate before they count. */
  push(entry: T): void {
    this.#past = [...this.#past.slice(-(HISTORY_LIMIT - 1)), entry];
    this.#future = [];
    this.#lastKey = null;
  }

  undo(): void {
    const previous = this.#past.at(-1);
    if (previous === undefined) return;
    this.#future = [...this.#future, this.#capture()];
    this.#past = this.#past.slice(0, -1);
    this.#restore(previous);
    this.#lastKey = null;
  }

  redo(): void {
    const next = this.#future.at(-1);
    if (next === undefined) return;
    this.#past = [...this.#past, this.#capture()];
    this.#future = this.#future.slice(0, -1);
    this.#restore(next);
    this.#lastKey = null;
  }
}
