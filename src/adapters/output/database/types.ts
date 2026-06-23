import type { ColumnType, Selectable } from "kysely";

/**
 * Kysely schema types. DB-managed columns (id, created_at, updated_at) are not
 * insertable/updatable. jsonb columns are written as stringified JSON (node-postgres
 * would otherwise turn JS arrays into PG arrays) and parsed back to objects on read.
 */
type JsonbWrite = string;

export interface ExtractionTable {
	id: ColumnType<string, never, never>;
	created_at: ColumnType<Date, never, never>;
	updated_at: ColumnType<Date, never, never>;
	deleted_at: ColumnType<Date | null, never, Date | null>;
	source_type: "text" | "audio";
	input_text: string;
	template: ColumnType<unknown, JsonbWrite, JsonbWrite>;
	result: ColumnType<unknown | null, JsonbWrite | null, JsonbWrite | null>;
	missing_fields: ColumnType<string[], JsonbWrite, JsonbWrite>;
	complete: ColumnType<boolean, boolean | undefined, boolean>;
	provider: ColumnType<string | null, string | null | undefined, string | null>;
	model: ColumnType<string | null, string | null | undefined, string | null>;
	meta: ColumnType<Record<string, unknown>, JsonbWrite, JsonbWrite>;
}

/**
 * Per-entity audit log of `extraction` (uniform schema), written by an AFTER
 * trigger and partitioned monthly. Read-only from the app (never inserted via
 * Kysely). `data` is the row snapshot after the operation; `row_id` is the
 * source row id (no FK).
 */
export interface ExtractionAuditTable {
	id: string;
	changed_at: Date;
	operation: "INSERT" | "UPDATE" | "DELETE";
	row_id: string;
	requested_by: string | null;
	data: unknown;
}

export interface Database {
	extraction: ExtractionTable;
	extraction_audit: ExtractionAuditTable;
}

export type ExtractionRow = Selectable<ExtractionTable>;
