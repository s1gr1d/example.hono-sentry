import { Hono } from "hono";
import { cors } from "hono/cors";

const examplePosts = [
  { id: "1", title: "First Post", content: "This is the first post." },
  { id: "2", title: "Second Post", content: "This is the second post." },
];

const api = new Hono();

api.use("/posts/*", cors());

api.get("/posts", (c) => {
  return c.json({ posts: examplePosts });
});

api.get("/posts/:id", (c) => {
  const id = c.req.param("id");
  const post = examplePosts.find((p) => p.id === id);
  return c.json({ post });
});

export default api;
