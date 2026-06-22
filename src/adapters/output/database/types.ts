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

export interface AuditLogTable {
	id: ColumnType<string, never, never>;
	table_name: string;
	operation: string;
	row_id: string | null;
	old_data: ColumnType<unknown | null, never, never>;
	new_data: ColumnType<unknown | null, never, never>;
	changed_at: ColumnType<Date, never, never>;
}

export interface Database {
	extraction: ExtractionTable;
	"audit.log": AuditLogTable;
}

export type ExtractionRow = Selectable<ExtractionTable>;
