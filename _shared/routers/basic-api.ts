import { Hono } from "hono";

const basicAPI = new Hono();

basicAPI.get("/", (c) => {
  return c.text("Hello Hono!");
});

basicAPI.get("/error", (c) => {
  throw new Error("This is a test error for Sentry!");
});

basicAPI.get("/error/:cause", (c) => {
  throw new Error("This is a test error for Sentry!", {
    cause: c.req.param("cause"),
  });
});

export default basicAPI;
