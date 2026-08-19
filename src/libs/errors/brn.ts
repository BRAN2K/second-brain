export const BRN_BASE = "brn:second-brain";

export const PROBLEM = {
  BAD_REQUEST: "bad-request",
  INVALID: "invalid",
  UNPROCESSABLE_ENTITY: "unprocessable-entity",
  NOT_FOUND: "not-found",
  CONFLICT: "conflict",
  FAILED: "failed",
  INTERNAL: "internal",
} as const;

export const RESOURCE = {
  HTTP: "http",
} as const;

export const SCOPE = {
  REQUEST: "request",
  ROUTE: "route",
} as const;
