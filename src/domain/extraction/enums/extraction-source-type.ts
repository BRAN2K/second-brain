/** Where an extraction's input came from: raw text or a transcribed audio file. */
export enum ExtractionSourceType {
  Text = "text",
  Audio = "audio",
}

/** Boundary guard: validates a raw string (HTTP/DB) before it becomes the enum type. */
export function isExtractionSourceType(
  value: string,
): value is ExtractionSourceType {
  return (Object.values(ExtractionSourceType) as string[]).includes(value);
}
