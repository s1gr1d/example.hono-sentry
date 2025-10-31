import { Env, Hono } from "hono";
import * as Sentry from "@sentry/cloudflare";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// export default app;

export default Sentry.withSentry((env: Env) => {
  // @ts-ignore
  const { id: versionId } = env.CF_VERSION_METADATA;
  return {
    // @ts-ignore
    dsn: env.SENTRY_DSN,
    release: versionId,
  };
}, app);
