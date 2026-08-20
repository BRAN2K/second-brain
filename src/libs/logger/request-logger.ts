import type { Logger } from "pino";
import { Elysia } from "elysia";
import { uuidv7 } from "uuidv7";

type TrackedRequest = Request & { requestId?: string; startTime?: number };

export function createRequestLogger(logger: Logger) {
  return new Elysia({ name: "request-logger" })
    .onRequest(({ request }) => {
      const trackedRequest = request as TrackedRequest;
      trackedRequest.requestId = uuidv7();
      trackedRequest.startTime = performance.now();

      logger.info(
        {
          requestId: trackedRequest.requestId,
          method: request.method,
          path: new URL(request.url).pathname,
        },
        "request started",
      );
    })
    .onAfterResponse({ as: "global" }, ({ request, path, set }) => {
      const trackedRequest = request as TrackedRequest;
      const durationMs =
        trackedRequest.startTime === undefined
          ? undefined
          : performance.now() - trackedRequest.startTime;
      const status = typeof set.status === "number" ? set.status : 200;
      const fields = {
        requestId: trackedRequest.requestId,
        method: request.method,
        path,
        status,
        durationMs,
      };

      if (status >= 500) {
        logger.error(fields, "request finished");
      } else if (status >= 400) {
        logger.warn(fields, "request finished");
      } else {
        logger.info(fields, "request finished");
      }
    });
}

export function getRequestId(request: Request): string | undefined {
  return (request as TrackedRequest).requestId;
}
