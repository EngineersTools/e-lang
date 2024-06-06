export function deepEqual<T1, T2>(obj1: T1, obj2: T2) {
  if (
    typeof obj1 === "object" &&
    obj1 !== null &&
    typeof obj2 === "object" &&
    obj2 !== null
  ) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
      return false;
    }
    for (const key of keys1) {
      if (!obj2.hasOwnProperty(key)) {
        return false;
      }
      if (
        typeof (obj1 as Record<string, any>)[key] === "object" &&
        typeof (obj2 as Record<string, any>)[key] === "object"
      ) {
        if (
          !deepEqual(
            (obj1 as Record<string, any>)[key],
            (obj2 as Record<string, any>)[key]
          )
        ) {
          return false;
        }
      } else {
        if (
          (obj1 as Record<string, any>)[key] !==
          (obj2 as Record<string, any>)[key]
        ) {
          return false;
        }
      }
    }
    return true;
  } else {
    //@ts-expect-error
    return obj1 === obj2;
  }
}
