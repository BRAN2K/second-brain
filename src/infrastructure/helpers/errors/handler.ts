import { Elysia } from "elysia";
import { AppError } from "./app-error";
import { BadRequestError, InternalServerError, RouteNotFoundError } from "./errors";
import type { ErrorBody } from "./schema";

export const httpErrorHandler = new Elysia({ name: "http-error-handler" }).onError(
  { as: "global" },
  ({ code, error, status }) => {
    if (error instanceof AppError) {
      return status(error.status, error.toBody() satisfies ErrorBody);
    }

    switch (code) {
      case "VALIDATION": {
        if (isHandlerResponseOutOfContract(error)) break;

        const badRequest = new BadRequestError(
          error.all.map((issue) => issue.summary ?? "Invalid value"),
        );

        return status(badRequest.status, badRequest.toBody() satisfies ErrorBody);
      }
      case "NOT_FOUND": {
        const notFound = new RouteNotFoundError();

        return status(notFound.status, notFound.toBody() satisfies ErrorBody);
      }
    }

    const internalError = new InternalServerError();

    return status(internalError.status, internalError.toBody() satisfies ErrorBody);
  },
);

function isHandlerResponseOutOfContract(error: { type: string }): boolean {
  return error.type === "response";
}
