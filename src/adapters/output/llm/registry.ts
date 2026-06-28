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
  /**
   * The single provider the app uses: the first available one in preference `order`,
   * else any available, else the first registered (so it can report unavailable at
   * request time). v1 has no fallback — see the use-case.
   */
  preferred(): ExtractionProvider | undefined;
  /** Preference order applied when picking the provider. */
  readonly order: string[];
}

export function createProviderRegistry(
  providers: ExtractionProvider[],
  order: string[],
): ProviderRegistry {
  const byName = new Map(providers.map((p) => [p.name, p]));
  const available = () => providers.filter((p) => p.isAvailable());
  return {
    all: () => [...providers],
    available,
    get: (name) => byName.get(name),
    preferred() {
      const usable = available();
      for (const name of order) {
        const match = usable.find((p) => p.name === name);
        if (match) {
          return match;
        }
      }
      return usable[0] ?? providers[0];
    },
    order,
  };
}
