import { Hono } from "hono";
import { cors } from "hono/cors";

const exampleUsers = [
  { id: "1", username: "Alex" },
  { id: "2", username: "Beth" },
];

const userAPI = new Hono();

userAPI.use("/user/*", cors());

userAPI.get("/user", (c) => {
  return c.json({ posts: exampleUsers });
});

userAPI.get("/user/:id", (c) => {
  const id = c.req.param("id");
  return c.json(exampleUsers.find((p) => p.id === id));
});

export default userAPI;
