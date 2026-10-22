export type ByteRange = { start: number; end: number };

export function parseByteRange(value: string | null, size: number): ByteRange | undefined | null {
  if (!value) return undefined;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || size <= 0 || (!match[1] && !match[2])) return null;
  const first = match[1] ? Number(match[1]) : undefined;
  const second = match[2] ? Number(match[2]) : undefined;
  if ((first !== undefined && !Number.isSafeInteger(first)) || (second !== undefined && !Number.isSafeInteger(second))) return null;
  const start = first ?? Math.max(0, size - (second ?? 0));
  const end = Math.min(first === undefined ? size - 1 : (second ?? size - 1), size - 1);
  if (start < 0 || end < 0 || start > end || start >= size) return null;
  return { start, end };
}
