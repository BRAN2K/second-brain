/**
 * Raised when extraction cannot even be attempted: a forced provider (`?provider=`) is
 * not available, or no provider is available at all. The HTTP layer maps the forced
 * case to 502 and the "none available" case per the error model (see ADR 0004/0007).
 */
export class NoProviderAvailable extends Error {
	constructor(public readonly forced?: string) {
		super(
			forced
				? `Forced provider "${forced}" is not available`
				: "No LLM provider is available",
		);
		this.name = "NoProviderAvailable";
	}
}
