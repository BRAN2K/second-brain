import type { Logger } from "pino";
import type { ErrorBody } from "./schema";
import { Elysia } from "elysia";
import { getRequestId } from "@/libs/logger";
import { AppError } from "./app-error";
import { BadRequestError, InternalServerError, RouteNotFoundError } from "./errors";

export function createHttpErrorHandler(logger: Logger) {
  return new Elysia({ name: "http-error-handler" }).onError(
    { as: "global" },
    ({ code, error, status, request }) => {
      const requestId = getRequestId(request);

      if (error instanceof AppError) {
        logger.warn({ requestId, brn: error.brn, message: error.message }, "request failed");

        return status(error.status, error.toBody() satisfies ErrorBody);
      }

      switch (code) {
        case "VALIDATION": {
          if (isHandlerResponseOutOfContract(error)) break;

          const badRequest = new BadRequestError(
            error.all.map((issue) => issue.summary ?? "Invalid value"),
          );
          logger.warn(
            { requestId, brn: badRequest.brn, message: badRequest.message },
            "request failed",
          );

          return status(badRequest.status, badRequest.toBody() satisfies ErrorBody);
        }
        case "NOT_FOUND": {
          const notFound = new RouteNotFoundError();
          logger.warn(
            { requestId, brn: notFound.brn, message: notFound.message },
            "request failed",
          );

          return status(notFound.status, notFound.toBody() satisfies ErrorBody);
        }
      }

      const internalError = new InternalServerError();
      logger.error(
        {
          requestId,
          brn: internalError.brn,
          err: { message: (error as Error)?.message, stack: (error as Error)?.stack },
        },
        "unhandled error",
      );

      return status(internalError.status, internalError.toBody() satisfies ErrorBody);
    },
  );
}

function isHandlerResponseOutOfContract(error: { type: string }): boolean {
  return error.type === "response";
}
