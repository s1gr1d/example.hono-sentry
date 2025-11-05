import type { Context, ExecutionContext, MiddlewareHandler } from "hono";
import { routePath } from "hono/route";
import {
  BaseTransportOptions,
  continueTrace,
  createStackParser,
  dedupeIntegration,
  functionToStringIntegration,
  getClient,
  getCurrentScope,
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
  startNewTrace,
  winterCGRequestToRequestData,
  withIsolationScope,
} from "@sentry/core";
import { HonoClient } from "./hono-client";
import { makeFetchTransport } from "./transport";
import {
  hasFetchEvent,
  hasExecutionCtx,
  logScopeData,
} from "@sentry-prototype/shared";
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

    const isolationScope = getIsolationScope();
    const newIsolationScope =
      isolationScope === getDefaultIsolationScope()
        ? isolationScope.clone()
        : isolationScope;

    console.log("routePath1", routePath(context));

    return await withIsolationScope(newIsolationScope, async () =>
      continueTrace(
        {
          sentryTrace: context.req.raw.headers.get("sentry-trace") ?? "",
          baggage: context.req.raw.headers.get("baggage"),
        },
        async () => {
          console.log("routePath2", routePath(context));
          logScopeData("isolationScope", newIsolationScope);

          // ExecutionCtx and FetchEvent only for Cloudflare Workers
          // hasFetchEvent(context);
          // hasExecutionCtx(context);

          const sentryClient = _init({
            dsn: context.env?.SENTRY_DSN ?? options.dsn,
            context,
            ...options,
            // request: context.req.raw,
            // context: hasExecutionContext ? context.executionCtx : new MockContext(),
          });

          /*
        if (callback) {
            callback(sentryClient);
        }
        */

          await next();

          newIsolationScope.setClient(sentryClient);

          newIsolationScope.setTransactionName(
            `${context.req.method} ${routePath(context)}`,
          );

          newIsolationScope.setSDKProcessingMetadata({
            normalizedRequest: winterCGRequestToRequestData(
              hasFetchEvent(context) ? context.event.request : context.req.raw,
            ),
          });

          logScopeData("isolationscope-after", newIsolationScope);

          console.log("scoope", getCurrentScope().getScopeData());

          console.log("scope", newIsolationScope.getPropagationContext());

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
