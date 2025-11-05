import { Hono } from "hono";
import { getIsolationScope, getCurrentScope } from "@sentry/core";
import * as Sentry from "@sentry/core";

const testAcsAPI = new Hono();

testAcsAPI.post("/test/api-simulation", async (c) => {
  const requestBody = await c.req.json().catch(() => ({}));
  const userId = requestBody.userId;

  console.log(`API SIMULATION - User ${userId}`);

  const isolationScope = getIsolationScope();
  const currentScope = getCurrentScope();

  Sentry.setUser({ id: userId });
  Sentry.setTag("user_id", userId);

  currentScope.setTag("processing_user", userId);
  currentScope.setContext("api_context", {
    userId,
    timestamp: Date.now(),
  });

  // Simulate database/external API calls
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 150 + 50));

  // Verify isolation after async operations
  const finalIsolationData = isolationScope.getScopeData();
  const finalCurrentData = currentScope.getScopeData();

  const isIsolated =
    finalIsolationData.user?.id === userId &&
    finalIsolationData.tags?.user_id === userId &&
    finalCurrentData.contexts?.api_context?.userId === userId;

  return c.json({
    userId,
    isIsolated,
    scope: {
      userId: finalIsolationData.user?.id,
      operation: finalIsolationData.tags?.api_operation,
      currentUserId: finalCurrentData.contexts?.api_context?.userId,
    },
  });
});

export default testAcsAPI;
