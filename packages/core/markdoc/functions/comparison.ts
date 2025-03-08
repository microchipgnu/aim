export function greaterThan(a: number, b: number): boolean {
  return a > b;
}

export function greaterThanOrEqual(a: number, b: number): boolean {
  return a >= b;
}

export function lessThan(a: number, b: number): boolean {
  return a < b;
}

export function lessThanOrEqual(a: number, b: number): boolean {
  return a <= b;
}

export function includes<T>(array: T[], item: T): boolean {
  return array.includes(item);
}
