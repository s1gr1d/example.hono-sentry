import { Hono } from "hono";
import { Redis } from "ioredis";

const redisAPI = new Hono();

const redis = new Redis();

redisAPI.get("/set/sample-key/:value", (c) => {
  const value = c.req.param("value");

  console.log(`Setting key: "sample-key" with value: ${value}`);
  redis.set("sample-key", value);

  return c.text(`Redis SET: sample-key = ${value}`);
});

redisAPI.get("/get/sample-key", async (c) => {
  const result = await redis.get("sample-key");

  return c.text(`Redis GET: ${result}`);
});

export default redisAPI;
