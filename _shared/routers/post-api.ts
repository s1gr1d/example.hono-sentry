import { Hono } from "hono";
import { cors } from "hono/cors";
import { routePath } from "hono/route";
import userAPI from "./user-api";

const examplePosts = [
  {
    id: "1",
    title: "First Post",
    content: "This is the first post.",
    userId: "1",
  },
  {
    id: "2",
    title: "Second Post",
    content: "This is the second post.",
    userId: "2",
  },
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

  const cause = c.req.param("cause");

  throw new Error(`This is a test post error: ${cause}`, { cause });
});

postsAPI.get("/posts/:id", (c) => {
  const id = c.req.param("id");
  const post = examplePosts.find((p) => p.id === id);
  return c.json({ post });
});

postsAPI.get("/posts/:id/user/:userId/", async (c) => {
postsAPI.get("/posts/:id/user/:userId", async (c) => {
  const userResponse = await userAPI.request(`/user/${c.req.param("userId")}`);

  const userId = (await userResponse.json()).id;

  const id = c.req.param("id");

  const post = examplePosts
    .filter((post) => post.userId === userId)
    .find((p) => p.id === id);
  return c.json({ post });
});

export default postsAPI;
