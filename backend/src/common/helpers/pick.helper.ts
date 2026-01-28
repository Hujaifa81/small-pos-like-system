export const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T | undefined,
  keys: K[],
): Partial<T> => {
  const result: Partial<T> = {};
  if (!obj) return result;

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  }

  return result;
};

export default pick;
