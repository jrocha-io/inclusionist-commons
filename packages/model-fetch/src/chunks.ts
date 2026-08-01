// Pure helper: flatten streamed chunks into one Uint8Array (extracted so it is unit-testable without a
// real ReadableStream).

/** Concatenate byte chunks into a single Uint8Array of `total` bytes. */
export function concatChunks(chunks: readonly Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}
