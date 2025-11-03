import { Hono } from "hono";
import { sentry } from "@sentry-prototype/1";

import { basicAPI, postsAPI } from "@sentry-prototype/shared";

// import * as Sentry from "@sentry/bun";

const app = new Hono();

/*
Sentry.init({
  dsn: import.meta.env.SENTRY_DSN,
  tracesSampleRate: 1,
  debug: true,
});

 */

app.use("*", sentry());

app.route("/posts-api", postsAPI);
app.route("/", basicAPI);

export default app;
