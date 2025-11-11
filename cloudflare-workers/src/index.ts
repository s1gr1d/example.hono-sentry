import { Hono } from "hono";
import * as Sentry from "@sentry/cloudflare";
import {
  basicAPI,
  postsAPI,
  redisAPI,
  testAcsAPI,
} from "@sentry-prototype/shared";

import { sentryCloudflare } from "@sentry-prototype/cloudflare";

type Bindings = {
  //@ts-ignore
  DB: HONO_CF_SAMPLE;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  sentryCloudflare({
    // @ts-ignore
    app, // also pass the app instance here

    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1,
    debug: true,
    integrations: (integrations) =>
      integrations.filter((integration) => integration.name !== "Hono"),
  }),
);

app.route("/", basicAPI);
app.route("/posts-api", postsAPI);
app.route("/redis", redisAPI);
app.route("/test-async-context", testAcsAPI);

app.get("/d1/users/:id", async (c) => {
  const userId = c.req.param("id");

  // @ts-ignore
  const db = Sentry.instrumentD1WithSentry(c.env.HONO_CF_SAMPLE);

  // @ts-ignore
  console.log("c.env.DB:", c.env.HONO_CF_SAMPLE);
  try {
    let { results } = await db
      .prepare("SELECT * FROM users WHERE user_id = ?")
      .bind(userId)
      .run();
    return c.json(results);
  } catch (e) {
    return c.json({ err: (e as Error).message }, 500);
  }
});

export default app;

/* Previous approach (with @sentry/cloudflare):

export default Sentry.withSentry((env: Env) => {
  // @ts-ignore
  const { id: versionId } = env.CF_VERSION_METADATA;
  return {
    // @ts-ignore
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1,
    release: versionId,
    debug: true,
  };
}, app);
*/
