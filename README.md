## 🔥 Hono Examples with Sentry

This repository contains example projects testing and demonstrating integrating Sentry with Hono applications.

Each directory represents a different Hono template (e.g. Cloudflare Workers, Deno or Bun).

### Sentry Middleware Prototypes

The Sentry SDK/Middleware prototypes are located in `_sentry`:
- `errors-only` (without any base SDK)
- `node` (with `@sentry/node`)
- `cloudflare` (with `@sentry/cloudflare`)

### Example Usage

The example usage can be found in the root directory in the respective platform folders:
- `cloudflare-workers`
- `nodejs`
- ...

### Shared Code

The `_shared` folder contains shared code used across multiple examples. It also contains the Hono routers that are
re-used in each platform example.

---

### Node.js

Node.js does not work natively with TypeScript, so the whole project needs to be built first.

```bash
npm run build
```

Then build and run the Node project:

```bash
npm run node:build-start
```

### Clean Project

```bash
npm run clean:js-files
```
