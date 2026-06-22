/** Domain types for an extraction record. Framework-free. */

export type ExtractionSourceType = "text" | "audio";

export interface Extraction {
	id: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt: Date | null;
	sourceType: ExtractionSourceType;
	/** Original text, or the transcription when the source is audio. */
	inputText: string;
	/** Snapshot of the simple template used for this extraction. */
	template: unknown;
	result: unknown | null;
	missingFields: string[];
	complete: boolean;
	provider: string | null;
	model: string | null;
	meta: Record<string, unknown>;
}

/** Input to create an extraction; DB-managed fields are omitted. */
export interface NewExtraction {
	sourceType: ExtractionSourceType;
	inputText: string;
	template: unknown;
	result?: unknown | null;
	missingFields?: string[];
	complete?: boolean;
	provider?: string | null;
	model?: string | null;
	meta?: Record<string, unknown>;
}
