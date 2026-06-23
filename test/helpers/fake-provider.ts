import { ProviderError } from "@/domain/errors/provider-error";
import type {
	ExtractionOutput,
	ExtractionProvider,
} from "@/domain/ports/extraction-provider";

/**
 * Test double for an `ExtractionProvider` with a scriptable `extract`. Records how
 * many times it was called so retry/fallback behavior can be asserted precisely.
 */
export interface FakeProvider extends ExtractionProvider {
	calls: number;
}

interface FakeOptions {
	name: string;
	available?: boolean;
	/** Outcome of each call in order; the last entry repeats once exhausted. */
	outcomes?: Array<"ok" | "transient" | "permanent">;
	/** Data returned on a successful call (defaults to `{ from: name }`). */
	data?: unknown;
}

export function fakeProvider(options: FakeOptions): FakeProvider {
	const outcomes = options.outcomes ?? ["ok"];
	const provider: FakeProvider = {
		name: options.name,
		calls: 0,
		isAvailable: () => options.available ?? true,
		async extract() {
			const outcome = outcomes[Math.min(provider.calls, outcomes.length - 1)];
			provider.calls++;
			if (outcome === "transient") {
				throw new ProviderError(options.name, true);
			}
			if (outcome === "permanent") {
				throw new ProviderError(options.name, false);
			}
			const output: ExtractionOutput = {
				data: options.data ?? { from: options.name },
				raw: { model: `${options.name}-model`, latencyMs: 1 },
			};
			return output;
		},
	};
	return provider;
}
