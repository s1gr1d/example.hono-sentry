import type { Context, ExecutionContext, MiddlewareHandler } from "hono";
import * as Sentry from "@sentry/core";
import { ClientOptions } from "@sentry/core";
import { HonoClient } from "./hono-client";

class MockContext implements ExecutionContext {
  passThroughOnException(): void {
    throw new Error("Method not implemented.");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async waitUntil(promise: Promise<any>): Promise<void> {
    await promise;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any;
}

export const sentry = (
  options?: ClientOptions,
  // callback?: (sentry: Toucan) => void,
): MiddlewareHandler => {
  return async (context, next) => {
    console.log("context:", context);

    console.log("options:", options);

    let hasExecutionContext = true;
    try {
      context.executionCtx;
    } catch {
      hasExecutionContext = false;
    }
    const sentry = Sentry.initAndBind(HonoClient, {
      dsn: c.env?.SENTRY_DSN ?? c.env?.NEXT_PUBLIC_SENTRY_DSN,
      // request: context.req.raw,
      // context: hasExecutionContext ? context.executionCtx : new MockContext(),
      ...options,
    });
    c.set("sentry", sentry);
    /*
    if (callback) {
      callback(sentry);
    }
    */

    await next();
    if (context.error) {
      sentry.captureException(context.error);
    }
  };
};
