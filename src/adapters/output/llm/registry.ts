import type { ExtractionProvider } from "@/domain/extraction/ports/http/extraction-provider";

/**
 * Holds the concrete providers wired at the composition root (`cmd/`) and exposes
 * availability + preference order to the selection policy. This is where, with real
 * providers (PR5), API-key presence decides `isAvailable()` and config decides `order`.
 */
export interface ProviderRegistry {
  /** Every registered provider, regardless of availability. */
  all(): ExtractionProvider[];
  /** Only providers currently usable (e.g. key configured). */
  available(): ExtractionProvider[];
  get(name: string): ExtractionProvider | undefined;
  /** Preference order applied when no provider is forced. */
  readonly order: string[];
}

export function createProviderRegistry(
  providers: ExtractionProvider[],
  order: string[],
): ProviderRegistry {
  const byName = new Map(providers.map((p) => [p.name, p]));
  return {
    all: () => [...providers],
    available: () => providers.filter((p) => p.isAvailable()),
    get: (name) => byName.get(name),
    order,
  };
}
