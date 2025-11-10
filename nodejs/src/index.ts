import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { sentry } from "@sentry-prototype/1";

import {
  basicAPI,
  postsAPI,
  redisAPI,
  testAcsAPI,
} from "@sentry-prototype/shared";

const app = new Hono();

app.use("*", sentry({ dsn: process.env.SENTRY_DSN }));

app.route("/", basicAPI);
app.route("/posts-api", postsAPI);
app.route("/redis", redisAPI);
app.route("/test-async-context", testAcsAPI);

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
