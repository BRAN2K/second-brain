import type { ColumnType } from "kysely";

type JsonbWrite = string;

export interface ExtractionTable {
  id: ColumnType<string, string, never>;
  created_at: ColumnType<Date, Date | null, never>;
  updated_at: ColumnType<Date, never, never>;
  deleted_at: ColumnType<Date | null, never, never>;
  source_type: ColumnType<"text" | "audio", "text" | "audio", never>;
  input_text: ColumnType<string, string, never>;
  template: ColumnType<unknown, JsonbWrite, never>;
  result: ColumnType<unknown | null, JsonbWrite | null, never>;
  missing_fields: ColumnType<string[], JsonbWrite, never>;
  complete: ColumnType<boolean, boolean, never>;
  provider: ColumnType<string, string, never>;
  model: ColumnType<string, string, never>;
  meta: ColumnType<Record<string, unknown>, JsonbWrite, never>;
}
export interface AuditTable {
  id: string;
  changed_at: Date;
  operation: "INSERT" | "UPDATE" | "DELETE";
  row_id: string;
  requested_by: string | null;
  data: unknown;
}

export interface Database {
  extraction: ExtractionTable;
  extraction_audit: AuditTable;
}
