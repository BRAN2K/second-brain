/**
 * UUID v7 (RFC 9562): a 128-bit id whose leading 48 bits are the Unix timestamp in ms,
 * making ids time-ordered — they sort by creation time, which the extraction cursor
 * pagination relies on. Generated in the domain so an aggregate has identity from birth.
 *
 * ponytail: hand-rolled (~15 lines) because `crypto.randomUUID` only emits v4 and a v7
 * dep isn't worth it. If we ever need monotonic ids within the same millisecond, switch
 * to a maintained lib (e.g. `uuidv7`).
 */

const UUID_V7_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * The id type for every entity in this project — a UUID v7 branded so it is nominally
 * distinct from a bare `string` (you can't pass any string where an id is expected) while
 * staying a real string at runtime (no wrapping at DB/JSON/cursor boundaries). One shared
 * type, since all aggregates use UUID v7 identity.
 */
export type UuidV7 = string & { readonly __brand: "UuidV7" };

export function generateUuidV7(): UuidV7 {
  const ts = Date.now();
  const bytes = new Uint8Array(16);

  // 48-bit big-endian millisecond timestamp.
  bytes[0] = (ts / 2 ** 40) & 0xff;
  bytes[1] = (ts / 2 ** 32) & 0xff;
  bytes[2] = (ts / 2 ** 24) & 0xff;
  bytes[3] = (ts / 2 ** 16) & 0xff;
  bytes[4] = (ts / 2 ** 8) & 0xff;
  bytes[5] = ts & 0xff;

  // Remaining 80 bits are random.
  crypto.getRandomValues(bytes.subarray(6));

  // Set version (7) and variant (10xx) per RFC 9562.
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}` as UuidV7;
}

export function isUuidV7(value: string): boolean {
  return UUID_V7_RE.test(value);
}

/** Validates and brands an existing string (DB row, request path) as a `UuidV7`. */
export function toUuidV7(value: string): UuidV7 {
  if (!isUuidV7(value)) {
    throw new Error(`Invalid UUID v7: "${value}"`);
  }
  return value as UuidV7;
}
