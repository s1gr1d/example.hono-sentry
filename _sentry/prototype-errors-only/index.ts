import type { Context, MiddlewareHandler } from "hono";
import { routePath } from "hono/route";
import {
  type BaseTransportOptions,
  continueTrace,
  createStackParser,
  dedupeIntegration,
  functionToStringIntegration,
  getActiveSpan,
  getDefaultIsolationScope,
  getIntegrationsToSetup,
  getIsolationScope,
  getRootSpan,
  initAndBind,
  type Integration,
  linkedErrorsIntegration,
  nodeStackLineParser,
  type Options,
  type StackParser,
  stackParserFromStackParserOptions,
  winterCGRequestToRequestData,
  withIsolationScope,
} from "@sentry/core";
import { HonoClient } from "./hono-client.js";
import { makeFetchTransport } from "./transport.js";
import { hasFetchEvent } from "@sentry-prototype/shared";
import { setAsyncLocalStorageAsyncContextStrategy } from "./asyncContext.js";
import * as Sentry from "@sentry/node";

const defaultStackParser: StackParser = createStackParser(
  nodeStackLineParser(),
);

export interface HonoOptions extends Options<BaseTransportOptions> {
  context?: Context;
}

/*
Sentry.init({
  dsn: import.meta.env.SENTRY_DSN,
  tracesSampleRate: 1,
  debug: true,
});

 */

export const sentry = (
  options: HonoOptions | undefined = {},
  // callback?: (sentry: Toucan) => void,
): MiddlewareHandler => {
  console.log("- - - - - - - - call sentry middleware - - - - - - - - - -");

  setAsyncLocalStorageAsyncContextStrategy();

  return async (context, next) => {
    console.log("- - - - - - - - - - -  new request - - - - - - - - - - -");

    return await withIsolationScope(async (isolationScope) =>
      continueTrace(
        {
          sentryTrace: context.req.raw.headers.get("sentry-trace") ?? "",
          baggage: context.req.raw.headers.get("baggage"),
        },
        async () => {
          // ExecutionCtx and FetchEvent only for Cloudflare Workers
          // hasFetchEvent(context);
          // hasExecutionCtx(context);

          /*
          const sentryClient = _init({
            dsn: context.env?.SENTRY_DSN ?? options.dsn,
            context,
            ...options,
          });

             */

          /*
          if (callback) {
              callback(sentryClient);
          }
          */

          // isolationScope.setClient(sentryClient);

          isolationScope.setSDKProcessingMetadata({
            normalizedRequest: winterCGRequestToRequestData(
              hasFetchEvent(context) ? context.event.request : context.req.raw,
            ),
          });

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
          }

          isolationScope.setTransactionName(
            `${context.req.method} ${routePath(context)}`,
          );

          if (context.error) {
            console.log("captureException...");
            // sentryClient?.captureException(context.error);
          }
        },
      ),
    );
  };
};

function getDefaultIntegrations(_options: Options): Integration[] {
  return [
    functionToStringIntegration(),
    linkedErrorsIntegration(),
    dedupeIntegration(),
  ];
}

function _init(options: HonoOptions) {
  if (options.defaultIntegrations === undefined) {
    options.defaultIntegrations = getDefaultIntegrations(options);
  }

  const clientOptions = {
    ...options,
    stackParser: stackParserFromStackParserOptions(
      options.stackParser || defaultStackParser,
    ),

    integrations: getIntegrationsToSetup(options),
    transport: options?.transport || makeFetchTransport,
  };

  return initAndBind(HonoClient, {
    dsn: options?.context?.env?.SENTRY_DSN ?? options.dsn,
    // request: context.req.raw,
    // context: hasExecutionContext ? context.executionCtx : new MockContext(),
    ...clientOptions,
  });
}
