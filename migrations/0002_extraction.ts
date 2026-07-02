import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
		CREATE TABLE extraction (
			id             uuid PRIMARY KEY DEFAULT uuidv7(),
			created_at     timestamptz NOT NULL DEFAULT now(),
			updated_at     timestamptz NOT NULL DEFAULT now(),
      deleted_at     timestamptz,
			source_type    text NOT NULL CHECK (source_type IN ('text', 'audio')),
			input_text     text NOT NULL,
			template       jsonb NOT NULL,
			result         jsonb,
			missing_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
			complete       boolean NOT NULL DEFAULT false,
			provider       text,
			model          text,
			meta           jsonb NOT NULL DEFAULT '{}'::jsonb
		);
	`.execute(db);

  await sql`
		CREATE INDEX extraction_active_id_idx
			ON extraction (id DESC)
			WHERE deleted_at IS NULL;
	`.execute(db);

  await sql`
		CREATE TRIGGER extraction_set_updated_at
			BEFORE UPDATE ON extraction
			FOR EACH ROW EXECUTE FUNCTION set_updated_at();
	`.execute(db);

  await sql`
		CREATE TABLE extraction_audit (
			id           uuid NOT NULL DEFAULT uuidv7(),
			changed_at   timestamptz NOT NULL DEFAULT now(),
			operation    text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
			row_id       uuid NOT NULL,
			requested_by text,
			data         jsonb NOT NULL,
			PRIMARY KEY (id, changed_at)
		) PARTITION BY RANGE (changed_at);
	`.execute(db);

  await sql`
		CREATE TABLE extraction_audit_default PARTITION OF extraction_audit DEFAULT;
	`.execute(db);

  await sql`
		CREATE INDEX extraction_audit_row_idx ON extraction_audit (row_id, changed_at);
	`.execute(db);

  await sql`
		CREATE TRIGGER extraction_audit_trigger
			AFTER INSERT OR UPDATE OR DELETE ON extraction
			FOR EACH ROW EXECUTE FUNCTION record_audit();
	`.execute(db);
}
