import type { Context, MiddlewareHandler } from "hono";
import { routePath } from "hono/route";
import {
  BaseTransportOptions,
  continueTrace,
  createStackParser,
  dedupeIntegration,
  functionToStringIntegration,
  getDefaultIsolationScope,
  getIntegrationsToSetup,
  getIsolationScope,
  initAndBind,
  Integration,
  linkedErrorsIntegration,
  nodeStackLineParser,
  Options,
  StackParser,
  stackParserFromStackParserOptions,
  winterCGRequestToRequestData,
  withIsolationScope,
} from "@sentry/core";
import { HonoClient } from "./hono-client";
import { makeFetchTransport } from "./transport";
import { hasFetchEvent } from "@sentry-prototype/shared";
import { setAsyncLocalStorageAsyncContextStrategy } from "./asyncContext";

const defaultStackParser: StackParser = createStackParser(
  nodeStackLineParser(),
);

export interface HonoOptions extends Options<BaseTransportOptions> {
  context?: Context;
}

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

          const sentryClient = _init({
            dsn: context.env?.SENTRY_DSN ?? options.dsn,
            context,
            ...options,
          });

          /*
          if (callback) {
              callback(sentryClient);
          }
          */

          isolationScope.setClient(sentryClient);

          isolationScope.setSDKProcessingMetadata({
            normalizedRequest: winterCGRequestToRequestData(
              hasFetchEvent(context) ? context.event.request : context.req.raw,
            ),
          });

          await next(); // Handler runs in between. Before is Request ⤴ and afterward is Response ⤵

          isolationScope.setTransactionName(
            `${context.req.method} ${routePath(context)}`,
          );

          if (context.error) {
            console.log("captureException...");
            sentryClient?.captureException(context.error);
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
