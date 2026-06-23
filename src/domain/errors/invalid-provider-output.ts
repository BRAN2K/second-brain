/**
 * Raised when a provider responded but its output does not structurally match the
 * requested schema (wrong types / out-of-enum) even after the lenient check. An
 * incomplete result is NOT this error — that is a successful 200 (see ADR 0005). This
 * is a processing failure mapped to 502.
 */
export class InvalidProviderOutput extends Error {
	constructor(
		public readonly provider: string,
		public readonly issues: string[],
	) {
		super(`Provider "${provider}" returned structurally invalid output`);
		this.name = "InvalidProviderOutput";
	}
}
