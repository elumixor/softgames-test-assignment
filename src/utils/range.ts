export function range(n: number): number[];
export function range(a: number, b: number): number[];
export function range(a: number, b?: number): number[] {
  if (b === undefined) {
    // range(n) → [1, 2, 3, ..., n]
    return Array.from({ length: a }, (_, i) => i + 1);
  }
  // range(a, b) → [a, a+1, ..., b-1] (b is exclusive)
  return Array.from({ length: b - a }, (_, i) => a + i);
}
