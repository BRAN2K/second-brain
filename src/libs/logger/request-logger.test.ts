import type { Logger } from "pino";
import { describe, expect, it } from "bun:test";
import { createRequestLogger } from "./request-logger";

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

describe("createRequestLogger", () => {
  it("logs request start and finish sharing the same requestId", async () => {
    const { logger, calls } = createFakeLogger();
    const app = createRequestLogger(logger).get("/ping", () => "pong");

    const response = await app.handle(new Request("http://localhost/ping"));
    await Bun.sleep(0);

    expect(response.status).toBe(200);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({ level: "info", message: "request started" });
    expect(calls[1]).toMatchObject({ level: "info", message: "request finished" });
    expect(calls[0].fields.requestId).toBe(calls[1].fields.requestId);
    expect(calls[1].fields.status).toBe(200);
    expect(typeof calls[1].fields.durationMs).toBe("number");
  });

  it("logs the finish event at warn for 4xx and error for 5xx", async () => {
    const { logger, calls } = createFakeLogger();
    const app = createRequestLogger(logger)
      .get("/client-error", ({ set }) => {
        set.status = 404;
        return "nope";
      })
      .get("/server-error", ({ set }) => {
        set.status = 500;
        return "boom";
      });

    await app.handle(new Request("http://localhost/client-error"));
    await app.handle(new Request("http://localhost/server-error"));
    await Bun.sleep(0);

    const finishes = calls.filter((call) => call.message === "request finished");
    expect(finishes[0].level).toBe("warn");
    expect(finishes[1].level).toBe("error");
  });

  it("still correlates start and finish for routes that don't match anything", async () => {
    const { logger, calls } = createFakeLogger();
    const app = createRequestLogger(logger);

    await app.handle(new Request("http://localhost/does-not-exist"));
    await Bun.sleep(0);

    expect(calls).toHaveLength(2);
    expect(calls[0].fields.requestId).toBeDefined();
    expect(calls[0].fields.requestId).toBe(calls[1].fields.requestId);
    expect(calls[1].fields.status).toBe(404);
    expect(typeof calls[1].fields.durationMs).toBe("number");
  });
});
