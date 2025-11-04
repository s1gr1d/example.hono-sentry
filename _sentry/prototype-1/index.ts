import type { Context, ExecutionContext, MiddlewareHandler } from "hono";
import { routePath } from "hono/route";
import {
  BaseTransportOptions,
  createStackParser,
  dedupeIntegration,
  functionToStringIntegration,
  getClient,
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
  return async (context, next) => {
    console.log("another request");
    const isolationScope = getIsolationScope();
    const newIsolationScope =
      isolationScope === getDefaultIsolationScope()
        ? isolationScope.clone()
        : isolationScope;

    return await withIsolationScope(
      newIsolationScope,
      async (isolationScope) => {
        logScopeData("isolationScope", isolationScope);
        logScopeData("newIsolationScope", newIsolationScope);

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

        newIsolationScope.setClient(sentryClient);

        isolationScope.setSDKProcessingMetadata({
          normalizedRequest: winterCGRequestToRequestData(
            hasFetchEvent(context) ? context.event.request : context.req.raw,
          ),
        });

        /*
        if (callback) {
            callback(sentryClient);
        }
        */

        await next();

        // fixme: transaction name is only sent to Sentry when on the isolationScope
        logScopeData("isolationScope-before", isolationScope);
        isolationScope.setTransactionName(
          `${context.req.method} ${routePath(context)}`,
        );
        logScopeData("isolationScope-after", isolationScope);

        if (context.error) {
          console.log("captureException...");
          getClient()?.captureException(context.error);
        }
      },
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
