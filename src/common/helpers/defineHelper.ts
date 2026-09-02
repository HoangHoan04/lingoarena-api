export {};

declare global {
  interface Array<T> {
    filterAndMap<U>(callback: (value: T, index: number, array: T[]) => [any, U]): U[];

    mapAndDistinct<U>(callback: (value: T, index: number, array: T[]) => U): U[];

    convertToMap<U>(callback: (value: T, index: number, array: T[]) => U): Map<U, T>;

    sum<U>(callback: (value: T, index: number, array: T[]) => U): number;
  }
}

Array.prototype.filterAndMap = function <T, U>(
  callback: (value: T, index: number, array: T[]) => [any, U],
): U[] {
  let result: U[] = [];
  for (let i = 0; i < this.length; i++) {
    const resCallback = callback(this[i], i, this);
    if (resCallback?.[0]) {
      result.push(resCallback?.[1]);
    }
  }
  return result;
};

Array.prototype.mapAndDistinct = function <T, U>(
  callback: (value: T, index: number, array: T[]) => U,
): U[] {
  const setValue: Set<any> = new Set();
  for (let i = 0; i < this.length; i++) {
    setValue.add(callback(this[i], i, this));
  }
  return [...setValue];
};

Array.prototype.convertToMap = function <T, U>(
  callback: (value: T, index: number, array: T[]) => U,
): Map<U, T> {
  const map = new Map();
  for (let i = 0; i < this.length; i++) {
    map.set(callback(this[i], i, this), this[i]);
  }
  return map;
};

Array.prototype.sum = function <T, U>(
  callback: (value: T, index: number, array: T[]) => U,
): number {
  let total = 0;
  for (let i = 0; i < this.length; i++) {
    total += +callback(this[i], i, this) || 0;
  }
  return total;
};
