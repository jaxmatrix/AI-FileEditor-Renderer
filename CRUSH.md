# CRUSH.md — Quick-start for agentic contributors

Repo status
- Minimal Node workspace scaffold. Backend and frontend workspaces are generated.

Install/build/lint/test
- Prereqs: Node 18+ (or 20+), npm 9+.
- Root install: npm install
- Build: (spec) backend: npm run build --workspace=backend; frontend: npm run build --workspace=frontend
- Dev (spec): npm run dev (will run run-all.js to start frontend:3000, backend:3001)
- Lint (spec): npm run lint --workspace=frontend
- Test: not configured yet. Current script exits with error. Add a test runner (e.g., vitest/jest) per workspace. Single test (spec): npx vitest run path/to/file.test.ts --workspace=frontend

Project layout (as specified)
- Monorepo: workspaces [frontend, backend]; run-all.js orchestrates both.
- Backend: Express + TypeScript; ts-node-dev for dev, tsc for build; outDir dist.
- Frontend: React + Vite + TypeScript; port 3000; proxy /api -> http://localhost:3001.

Conventions and code style
- Modules: backend uses commonjs; frontend uses ES modules.
- Imports: prefer absolute app-level paths only if tsconfig/baseUrl or vite aliases are set; otherwise use relative. Group: std/lib, external, internal, then styles/assets.
- Formatting: Prettier defaults (2-space indent, semicolons, single quotes in JS/TS unless JSX). Keep lines ≤ 100 chars where practical.
- Types: strict TypeScript. Avoid any; prefer explicit function return types; narrow with guards. Use interfaces for object shapes; types for unions/aliases.
- Naming: PascalCase for types/classes/components; camelCase for vars/functions; UPPER_SNAKE for constants/env. React components in frontend as PascalCase files.
- Error handling: backend route handlers must try/catch, respond with res.status(4xx/5xx).json({ error: message }); never leak stack traces. Core classes throw Error with clear messages; callers handle and map to HTTP.
- Async: prefer async/await; always await fs/promises; don’t ignore returned Promises. In Express, return after sending response.
- State/immutability: avoid in-place mutation when creating patches or indices; prefer pure functions where feasible.
- Logging: concise, structured where possible; no secrets or tokens in logs.

Testing (when added)
- Unit tests per package under src with *.test.ts(x). Frontend: vitest + jsdom; Backend: vitest/jest + supertest for HTTP.
- Run single test file: npx vitest run src/path/to/file.test.ts --workspace=<pkg>

Cursor/Copilot rules
- No .cursor/rules, .cursorrules, or .github/copilot-instructions.md present at this time. If added, mirror key expectations here.
