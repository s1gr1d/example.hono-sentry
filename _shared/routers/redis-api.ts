import { Hono } from "hono";
import { Redis } from "ioredis";

const redisAPI = new Hono();

let redis: Redis | null = null;

function getRedisClient() {
  if (!redis) {
    redis = new Redis();
  }
  return redis;
}

redisAPI.get("/set/sample-key/:value", (c) => {
  const value = c.req.param("value");
  const client = getRedisClient();

  console.log(`Setting key: "sample-key" with value: ${value}`);
  client.set("sample-key", value);

  return c.text(`Redis SET: sample-key = ${value}`);
});

redisAPI.get("/get/sample-key", async (c) => {
  const client = getRedisClient();
  const result = await client.get("sample-key");

  return c.text(`Redis GET: ${result}`);
});

export default redisAPI;
