import { type Kysely, sql } from "kysely";

/**
 * `extraction` table — the central record (one row per extraction request).
 * Metadata owned by the DB: id (`uuidv7()`), `created_at`/`updated_at` (trigger),
 * soft delete (`deleted_at`), and audit history (generic trigger). See ADR 0003.
 */
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
		)
	`.execute(db);

	// Cursor pagination filters out soft-deleted rows and orders by id (UUIDv7).
	await sql`
		CREATE INDEX extraction_active_id_idx
			ON extraction (id DESC)
			WHERE deleted_at IS NULL
	`.execute(db);

	await sql`
		CREATE TRIGGER extraction_set_updated_at
			BEFORE UPDATE ON extraction
			FOR EACH ROW EXECUTE FUNCTION set_updated_at()
	`.execute(db);

	await sql`
		CREATE TRIGGER extraction_audit
			AFTER INSERT OR UPDATE OR DELETE ON extraction
			FOR EACH ROW EXECUTE FUNCTION audit.if_modified_func()
	`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await sql`DROP TABLE IF EXISTS extraction`.execute(db);
}
