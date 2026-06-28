import { type Kysely, sql } from "kysely";

// Roll-forward only: no `down` (see ADR 0003). To undo, write a new migration.
export async function up(db: Kysely<unknown>): Promise<void> {
  // Generic trigger fn: bumps updated_at on every UPDATE. Reused by any table
  // that has an updated_at column.
  await sql`
		CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
		BEGIN
			NEW.updated_at = now();
			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;
	`.execute(db);

  // Generic audit trigger fn: writes one row per change to "<table>_audit"
  // (uniform schema). Soft delete (deleted_at NULL -> NOT NULL) is recorded as
  // DELETE; data is the row snapshot after the operation (OLD for hard deletes);
  // requested_by comes from the session GUC app.requested_by (NULL until set);
  // row_id is the source row id (no FK).
  await sql`
		CREATE FUNCTION record_audit() RETURNS trigger AS $$
		DECLARE
			audit_table text := TG_TABLE_NAME || '_audit';
			new_data jsonb := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
			old_data jsonb := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
			snapshot jsonb := COALESCE(new_data, old_data);
			op text := TG_OP;
		BEGIN
			IF TG_OP = 'UPDATE'
				AND old_data ? 'deleted_at'
				AND old_data->>'deleted_at' IS NULL
				AND new_data->>'deleted_at' IS NOT NULL THEN
				op := 'DELETE';
			END IF;

			EXECUTE format(
				'INSERT INTO %I (operation, row_id, requested_by, data) VALUES ($1, $2, $3, $4)',
				audit_table
			) USING op, (snapshot->>'id')::uuid, current_setting('app.requested_by', true), snapshot;

			RETURN NULL;
		END;
		$$ LANGUAGE plpgsql;
	`.execute(db);
}
