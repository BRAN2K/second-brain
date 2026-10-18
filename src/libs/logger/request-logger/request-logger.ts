import { Elysia } from "elysia";
import { uuidv7 } from "uuidv7";
import { Logger } from "../logger/logger";

type TrackedRequest = Request & { requestId?: string; startTime?: number };

export interface RequestLoggerOptions {
  logger?: Logger;
  quietPathPrefixes: string[];
}

export function createRequestLogger(options: RequestLoggerOptions) {
  const { quietPathPrefixes, logger = Logger.getInstance() } = options;
  const isQuietPath = (path: string) =>
    quietPathPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

  return new Elysia({ name: "request-logger" })
    .onRequest(({ request }) => {
      const trackedRequest = request as TrackedRequest;
      trackedRequest.requestId = uuidv7();
      trackedRequest.startTime = performance.now();

      if (isQuietPath(new URL(request.url).pathname)) {
        return;
      }

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

      if (isQuietPath(path)) {
        return;
      }

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
