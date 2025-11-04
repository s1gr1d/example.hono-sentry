import { Hono } from "hono";
import { cors } from "hono/cors";
import { routePath } from "hono/route";

const examplePosts = [
  { id: "1", title: "First Post", content: "This is the first post." },
  { id: "2", title: "Second Post", content: "This is the second post." },
];

const postsAPI = new Hono();

postsAPI.use("/posts/*", cors());

postsAPI.get("/posts", (c) => {
  return c.json({ posts: examplePosts });
});

postsAPI.get("/posts/error", (c) => {
  throw new Error("Simulated error");
});

postsAPI.get("/posts/error/:cause", (c) => {
  console.log("Route Path (in route):", routePath(c));

  throw new Error("This is a test post error for Sentry!", {
    cause: c.req.param("cause"),
  });
});

postsAPI.get("/posts/:id", (c) => {
  const id = c.req.param("id");
  const post = examplePosts.find((p) => p.id === id);
  return c.json({ post });
});

export default postsAPI;
