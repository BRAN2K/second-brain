import { type Kysely, sql } from "kysely";

/**
 * Generic, reusable DB-first infrastructure (attached per table in later migrations):
 *  - `set_updated_at()`  : BEFORE UPDATE trigger fn that bumps `updated_at`.
 *  - `audit` schema + `audit.log` table + `audit.if_modified_func()`:
 *    AFTER INSERT/UPDATE/DELETE trigger fn that records OLD/NEW JSON snapshots.
 *
 * See ADR 0003 (DB-first metadata).
 */
export async function up(db: Kysely<unknown>): Promise<void> {
	// updated_at maintenance
	await sql`
		CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
		BEGIN
			NEW.updated_at = now();
			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;
	`.execute(db);

	// audit / history
	await sql`CREATE SCHEMA audit`.execute(db);

	await sql`
		CREATE TABLE audit.log (
			id          uuid PRIMARY KEY DEFAULT uuidv7(),
			table_name  text NOT NULL,
			operation   text NOT NULL,
			row_id      uuid,
			old_data    jsonb,
			new_data    jsonb,
			changed_at  timestamptz NOT NULL DEFAULT now()
		)
	`.execute(db);

	await sql`CREATE INDEX audit_log_table_row_idx ON audit.log (table_name, row_id)`.execute(
		db,
	);

	// Generic trigger fn. Assumes the audited table has a uuid `id` column.
	await sql`
		CREATE FUNCTION audit.if_modified_func() RETURNS trigger AS $$
		BEGIN
			IF (TG_OP = 'DELETE') THEN
				INSERT INTO audit.log (table_name, operation, row_id, old_data)
					VALUES (TG_TABLE_NAME, TG_OP, OLD.id, to_jsonb(OLD));
				RETURN OLD;
			ELSIF (TG_OP = 'UPDATE') THEN
				INSERT INTO audit.log (table_name, operation, row_id, old_data, new_data)
					VALUES (TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
				RETURN NEW;
			ELSIF (TG_OP = 'INSERT') THEN
				INSERT INTO audit.log (table_name, operation, row_id, new_data)
					VALUES (TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(NEW));
				RETURN NEW;
			END IF;
			RETURN NULL;
		END;
		$$ LANGUAGE plpgsql;
	`.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
	await sql`DROP FUNCTION IF EXISTS audit.if_modified_func()`.execute(db);
	await sql`DROP SCHEMA IF EXISTS audit CASCADE`.execute(db);
	await sql`DROP FUNCTION IF EXISTS set_updated_at()`.execute(db);
}
