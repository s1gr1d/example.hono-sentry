import type { Context } from "hono";
import type { Scope } from "@sentry/core";
// ExecutionCtx and FetchEvent only available in Cloudflare Workers

export function hasExecutionCtx(c: Context): boolean {
  let hasExecutionContext = true;
  try {
    c.executionCtx;
  } catch {
    hasExecutionContext = false;
  }
  return hasExecutionContext;
}

export function hasFetchEvent(c: Context): boolean {
  let hasFetchEvent = true;
  try {
    c.event;
  } catch {
    hasFetchEvent = false;
  }
  return hasFetchEvent;
}

export function logScopeData(label: string, scope: Scope): void {
  console.log(`--- Scope data: ${label} ---`);
  console.log("traceId:", scope.getScopeData().propagationContext.traceId);
  console.log("transactionName", scope.getScopeData().transactionName);
  console.log(
    "normalizedRequest.url",
    scope.getScopeData().sdkProcessingMetadata.normalizedRequest?.url,
  );
  console.log("--- --- --- --- --- --- --- --- ---");
}

/*
1 -transactionName GET /*
1-traceId 3384d91e75834a22bb229382ac25c3df
1-request url undefined

2-transactionName GET /posts-api/posts/error/:cause
2-traceId 3384d91e75834a22bb229382ac25c3df
2-request url http://localhost:3000/posts-api/posts/error/test-cause-

---
1-transactionName GET /posts-api/posts/error/:cause
1-traceId 3384d91e75834a22bb229382ac25c3df
1-request url undefined
raw req http://localhost:3000/favicon.ico
2-transactionName GET /posts-api/posts/error/:cause
2-traceId 3384d91e75834a22bb229382ac25c3df
2-request url http://localhost:3000/favicon.ic


 */

/*
1-transactionName GET /*
1-traceId 3384d91e75834a22bb229382ac25c3df
1-request url undefined

2-transactionName GET /*
2-traceId 3384d91e75834a22bb229382ac25c3df
2-request url http://localhost:3000/posts-api/posts/error/test-cause-

---

1-transactionName GET /posts-api/posts/error/:cause
1-traceId 3384d91e75834a22bb229382ac25c3df
1-request url undefined
raw req http://localhost:3000/favicon.ico
2-transactionName GET /posts-api/posts/error/:cause
2-traceId 3384d91e75834a22bb229382ac25c3df
2-request url http://localhost:3000/favicon.ic
 */
