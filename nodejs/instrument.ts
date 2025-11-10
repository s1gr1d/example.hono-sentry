import * as Sentry from "@sentry/node";

console.log("Initializing Sentry...");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1,
  debug: true,
});
