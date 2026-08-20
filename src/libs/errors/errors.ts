import type { AppErrorOptions } from "./app-error";
import { AppError } from "./app-error";
import { PROBLEM, RESOURCE, SCOPE } from "./brn";

export class UnprocessableEntityError extends AppError {
  static readonly status = 422;
  static readonly problem = PROBLEM.UNPROCESSABLE_ENTITY;

  constructor(issues: string[], options: Omit<AppErrorOptions, "issues">) {
    super({ ...options, issues });
  }
}

export class NotFoundError extends AppError {
  static readonly status = 404;
  static readonly problem = PROBLEM.NOT_FOUND;
}

export class ConflictError extends AppError {
  static readonly status = 409;
  static readonly problem = PROBLEM.CONFLICT;
}

export class UpstreamError extends AppError {
  static readonly status = 502;
  static readonly problem = PROBLEM.FAILED;
}

export class BadRequestError extends AppError {
  static readonly status = 400;
  static readonly problem = PROBLEM.BAD_REQUEST;

  constructor(issues: string[]) {
    super({
      resource: RESOURCE.HTTP,
      scope: SCOPE.REQUEST,
      message: "Request validation failed",
      issues,
    });
  }
}

export class RouteNotFoundError extends AppError {
  static readonly status = 404;
  static readonly problem = PROBLEM.NOT_FOUND;

  constructor() {
    super({ resource: RESOURCE.HTTP, scope: SCOPE.ROUTE, message: "Route not found" });
  }
}

export class InternalServerError extends AppError {
  static readonly status = 500;
  static readonly problem = PROBLEM.INTERNAL;

  constructor() {
    super({ resource: RESOURCE.HTTP, message: "Internal server error" });
  }
}
