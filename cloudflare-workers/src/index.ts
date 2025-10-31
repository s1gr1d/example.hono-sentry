import { Env, Hono } from "hono";
import * as Sentry from "@sentry/cloudflare";
import api from "./api";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.use(async (c, next) => {
  await next();

  c.res.headers.set("X-Random-Header", `hello-header`);
});

app.route("/api", api);

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
