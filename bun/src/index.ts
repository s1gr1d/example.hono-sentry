import { Hono } from "hono";

import * as Sentry from "@sentry/bun";
import api from "./api";

const app = new Hono();

Sentry.init({
  dsn: import.meta.env.SENTRY_DSN,
  tracesSampleRate: 1,
  debug: true,
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/bun-api", api);

export default app;
