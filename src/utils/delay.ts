export function delay(seconds: number) {
  return new Promise<void>((r) => setTimeout(r, seconds * 1000));
}
