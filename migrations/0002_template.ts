import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
		CREATE TABLE template (
			id          uuid PRIMARY KEY DEFAULT uuidv7(),
			name        text NOT NULL,
			description text,
			items       jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(items) = 'array'),
			rules       text[] DEFAULT '{}',
			created_at  timestamptz NOT NULL DEFAULT now(),
			updated_at  timestamptz NOT NULL DEFAULT now(),
			deleted_at  timestamptz
		);
	`.execute(db);

  await sql`
		CREATE INDEX template_active_id_idx
			ON template (id DESC)
			WHERE deleted_at IS NULL;
	`.execute(db);

  await sql`
		CREATE TRIGGER template_set_updated_at
			BEFORE UPDATE ON template
			FOR EACH ROW EXECUTE FUNCTION set_updated_at();
	`.execute(db);

  await sql`
		CREATE TABLE template_audit (
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
		CREATE TABLE template_audit_default PARTITION OF template_audit DEFAULT;
	`.execute(db);

  await sql`
		CREATE INDEX template_audit_row_idx ON template_audit (row_id, changed_at);
	`.execute(db);

  await sql`
		CREATE TRIGGER template_audit_trigger
			AFTER INSERT OR UPDATE OR DELETE ON template
			FOR EACH ROW EXECUTE FUNCTION record_audit();
	`.execute(db);
}
