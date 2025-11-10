## 🔥 Hono Examples with Sentry

This repository contains example projects testing and demonstrating integrating Sentry with Hono applications.

Each directory represents a different Hono template (e.g. Cloudflare Workers, Deno or Bun).

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
