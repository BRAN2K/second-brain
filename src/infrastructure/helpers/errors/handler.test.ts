import { describe, expect, it } from "bun:test";
import { Elysia, t } from "elysia";
import type { Logger } from "pino";
import { RESOURCE } from "./brn";
import { NotFoundError } from "./errors";
import { createHttpErrorHandler } from "./handler";

type LogCall = {
  level: "info" | "warn" | "error";
  fields: Record<string, unknown>;
  message: string;
};

function createFakeLogger(): { logger: Logger; calls: LogCall[] } {
  const calls: LogCall[] = [];
  const record =
    (level: LogCall["level"]) => (fields: Record<string, unknown>, message: string) => {
      calls.push({ level, fields, message });
    };

  const logger = {
    info: record("info"),
    warn: record("warn"),
    error: record("error"),
  } as unknown as Logger;

  return { logger, calls };
}

describe("createHttpErrorHandler", () => {
  it("logs warn and maps a thrown AppError", async () => {
    const { logger, calls } = createFakeLogger();
    const app = new Elysia().use(createHttpErrorHandler(logger)).get("/missing", () => {
      throw new NotFoundError({ resource: RESOURCE.HTTP });
    });

    const response = await app.handle(new Request("http://localhost/missing"));
    const body = (await response.json()) as { brn: string };

    expect(response.status).toBe(404);
    expect(body.brn).toContain("not-found");
    expect(calls).toHaveLength(1);
    expect(calls[0].level).toBe("warn");
  });

  it("logs warn and maps a validation failure", async () => {
    const { logger, calls } = createFakeLogger();
    const app = new Elysia()
      .use(createHttpErrorHandler(logger))
      .post("/things", () => "ok", { body: t.Object({ name: t.String() }) });

    const response = await app.handle(
      new Request("http://localhost/things", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    expect(calls).toHaveLength(1);
    expect(calls[0].level).toBe("warn");
  });

  it("logs warn and maps an unmatched route to not-found", async () => {
    const { logger, calls } = createFakeLogger();
    const app = new Elysia().use(createHttpErrorHandler(logger));

    const response = await app.handle(new Request("http://localhost/nope"));

    expect(response.status).toBe(404);
    expect(calls).toHaveLength(1);
    expect(calls[0].level).toBe("warn");
  });

  it("logs error with the original stack trace for unmapped exceptions", async () => {
    const { logger, calls } = createFakeLogger();
    const app = new Elysia().use(createHttpErrorHandler(logger)).get("/boom", () => {
      throw new Error("boom");
    });

    const response = await app.handle(new Request("http://localhost/boom"));

    expect(response.status).toBe(500);
    expect(calls).toHaveLength(1);
    expect(calls[0].level).toBe("error");
    expect(calls[0].fields.err).toMatchObject({ message: "boom" });
    expect((calls[0].fields.err as { stack?: string }).stack).toContain("boom");
  });
});
