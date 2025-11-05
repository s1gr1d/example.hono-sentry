import { Env, Hono } from "hono";
import * as Sentry from "@sentry/cloudflare";
import { basicAPI, postsAPI, testAcsAPI } from "@sentry-prototype/shared";

const app = new Hono();

app.route("/", basicAPI);
app.route("/posts-api", postsAPI);
app.route("/test-async-context", testAcsAPI);

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
