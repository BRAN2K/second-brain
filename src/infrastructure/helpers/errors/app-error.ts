import { BRN_BASE } from "./brn";
import type { ErrorBody } from "./schema";

export interface AppErrorOptions {
  resource: string;
  scope?: string;
  problem?: string;
  message?: string;
  issues?: string[];
  cause?: unknown;
}

export abstract class AppError extends Error {
  /** Public machine-readable identifier: brn:second-brain:<resource>[:<scope>]:<problem>. */
  readonly brn: string;
  readonly issues: string[];

  constructor(options: AppErrorOptions) {
    const problem = options.problem ?? (new.target as unknown as { problem: string }).problem;

    super(options.message ?? `${options.resource} ${problem}`, { cause: options.cause });
    this.name = new.target.name;
    this.issues = options.issues ?? [];
    this.brn = [BRN_BASE, options.resource, options.scope, problem].filter(Boolean).join(":");
  }

  get status(): number {
    return (this.constructor as unknown as { status: number }).status;
  }

  toBody(): ErrorBody {
    return {
      brn: this.brn,
      message: this.message,
      ...(this.issues.length ? { issues: this.issues } : {}),
    };
  }
}
