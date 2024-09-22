import { deepEqual } from "./object.functions.js";

/**
 * Return a new array with unique values
 * @param arr The array to remove duplicates from
 * @returns The array with unique values
 */
export function unique<T>(arr: T[]): T[] {
  return arr.filter(uniqueFilter);
}

export function uniqueFilter<T>(value: T, index: number, self: T[]) {
  if (typeof value === "object" && value !== null) {
    return self.findIndex((v) => deepEqual(value, v)) === index;
  } else {
    return self.indexOf(value) === index;
  }
}

export function sortBy<T extends Record<string, any>>(
  arr: T[],
  prop: keyof T
): T[] {
  return arr.sort((a, b) => {
    let left = a;
    let right = b;

    if (typeof a[prop] === "string") left = a[prop].toUpperCase();
    if (typeof b[prop] === "string") right = b[prop].toUpperCase();

    return left < right ? -1 : left > right ? 1 : 0;
  });
}

export function areEqual<T1, T2>(arr1: T1[], arr2: T2[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (!deepEqual(arr1[i], arr2[i])) {
      return false;
    }
  }

  return true;
}

export function isSubsetOf<T1, T2>(arr1: T1[], arr2: T2[]): boolean {
  return arr1.every((v) => arr2.some((v2) => deepEqual(v, v2)));
}

export function includesBy<T extends Record<string, any>>(
  arr: T[],
  val: T,
  prop: keyof T
): boolean {
  return arr.map((i) => i[prop]).includes(val[prop]);
}

export function findBy<T extends Record<string, any>>(
  arr: T[],
  val: T,
  prop: keyof T
): T | undefined {
  const index = arr.map((i) => i[prop]).findIndex((i) => i === val[prop]);

  if (index === -1) return undefined;

  return arr[index];
}
