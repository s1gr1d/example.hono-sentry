import type { Context, MiddlewareHandler } from "hono";
import { routePath } from "hono/route";
import {
  type BaseTransportOptions,
  continueTrace,
  getActiveSpan,
  getClient,
  getRootSpan,
  type Options,
  winterCGRequestToRequestData,
  withIsolationScope,
} from "@sentry/core";
import { hasFetchEvent } from "@sentry-prototype/shared";
import * as Sentry from "@sentry/node";

export interface HonoOptions extends Options<BaseTransportOptions> {
  context?: Context;
}

export const sentryNode = (
  options: HonoOptions | undefined = {},
  // callback?: (sentry: Toucan) => void,
): MiddlewareHandler => {
  console.log("- - - - - - - - call sentry middleware - - - - - - - - - -");

  const nodeClient = Sentry.init({ ...options });

  return async (context, next) => {
    console.log("- - - - - - - - - - -  new request - - - - - - - - - - -");

    return await withIsolationScope(async (isolationScope) =>
      continueTrace(
        {
          sentryTrace: context.req.raw.headers.get("sentry-trace") ?? "",
          baggage: context.req.raw.headers.get("baggage"),
        },
        async () => {
          isolationScope.setSDKProcessingMetadata({
            normalizedRequest: winterCGRequestToRequestData(
              hasFetchEvent(context) ? context.event.request : context.req.raw,
            ),
          });

          console.log("before context", routePath(context));

          await next(); // Handler runs in between. Before is Request ⤴ and afterward is Response ⤵

          const activeSpan = getActiveSpan();
          if (activeSpan) {
            activeSpan.updateName(
              `${context.req.method} ${routePath(context)}`,
            );
            Sentry.updateSpanName(
              getRootSpan(activeSpan),
              `${context.req.method} ${routePath(context)}`,
            );

            console.log("activeSpan", activeSpan);
          }

          isolationScope.setTransactionName(
            `${context.req.method} ${routePath(context)}`,
          );

          if (context.error) {
            console.log("captureException...");
            getClient()?.captureException(context.error);
          }
        },
      ),
    );
  };
};
