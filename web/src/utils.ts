/** For creating class name strings */
export const cn = (list: (string | undefined)[]) =>
  list.filter((item) => item !== null && item !== undefined).join(" ");

/**
 * This manages multiple groups of debounced function calls. Function calls with the same
 * given debounceKey will be debounced together within the same group.
 */
export class MultiDebouncer {
  private keyToTimeoutId: { [key: string]: ReturnType<typeof setTimeout> } = {};

  /** Milliseconds to delay function call */
  private delay: number;

  constructor(delay: number) {
    this.delay = delay;
  }

  private cancelGroup(key: string) {
    const timeoutId = this.keyToTimeoutId[key];
    if (timeoutId === undefined) {
      return;
    }
    clearTimeout(timeoutId);
    delete this.keyToTimeoutId[key];
  }

  call(callback: () => void, debounceKey: string) {
    this.cancelGroup(debounceKey);

    const timeoutId = setTimeout(() => {
      callback();
      this.cancelGroup(debounceKey);
    }, this.delay);

    this.keyToTimeoutId[debounceKey] = timeoutId;
  }
}
