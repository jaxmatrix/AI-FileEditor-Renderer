# AI-Powered Editor Backend - File Specification

This document provides a detailed specification for each file required for the "AI-Powered, Version-Controlled Document Editor" project. This is not code, but a set of requirements for generating the code.

## 1. Root Directory

### `/.gitignore`

- **Purpose:** To prevent specified files and directories from being tracked by Git.
- **Requirements:**
    - Must ignore standard log directories and files (`logs`, `*.log`, `npm-debug.log*`, etc.).
    - Must ignore Node.js dependencies and build artifacts (`node_modules`, `dist`).
    - Must ignore common OS and IDE metadata files (`.DS_Store`, `.idea`, `.vscode`).
    - Must specifically ignore the project's metadata directory (`.project_meta/`).

### `/package.json`

- **Purpose:** To define the root of the monorepo, manage workspaces, and provide top-level scripts.
- **Requirements:**
    - Must be a private package (`"private": true`).
    - Must define `frontend` and `backend` in the `workspaces` array.
    - Must provide an `install-all` script to install root and workspace dependencies.
    - Must provide a `dev` script that executes `run-all.js`.
    - Must list `concurrently` as a dev dependency.

### `/run-all.js`

- **Purpose:** A Node.js script to launch both the frontend and backend development servers simultaneously.
- **Requirements:**
    - Must use the `child_process` module's `exec` function.
    - Must execute `npm run dev --workspace=backend`.
    - Must execute `npm run dev --workspace=frontend`.
    - Must pipe the `stdout` and `stderr` of both child processes to the main process's `stdout` and `stderr` so all logs are visible.
    - Must log informative messages about which servers are starting and their expected ports.

## 2. Backend Directory (`/backend/`)

### `/backend/package.json`

- **Purpose:** Defines the backend Express.js project, its scripts, and its dependencies.
- **Requirements:**
    - **Dependencies:** Must include `express`, `cors`, and `diff`.
    - **Dev Dependencies:** Must include `typescript`, `ts-node-dev`, `@types/node`, `@types/express`, `@types/cors`, and `@types/diff`.
    - **Scripts:**
        - `build`: Must compile TypeScript using `tsc`.
        - `dev`: Must run the server using `ts-node-dev` with automatic restarting (`--respawn`) and transpile-only (`--transpile-only`) for speed.
        - `start`: Must run the compiled JavaScript output from the `dist` folder (`node dist/server.js`).

### `/backend/tsconfig.json`

- **Purpose:** Configures the TypeScript compiler for the backend project.
- **Requirements:**
    - `target`: Must be `ES2020` or newer.
    - `module`: Must be `commonjs` (as it's an Express/Node.js project).
    - `rootDir`: Must be `./src`.
    - `outDir`: Must be `./dist`.
    - `strict`: Must be `true`.
    - `esModuleInterop`: Must be `true`.
    - `resolveJsonModule`: Must be `true`.
    - `include`: Must be `["src"]`.

### `/backend/src/server.ts`

- **Purpose:** The main entry point for the backend Express server.
- **Requirements:**
    - Must import and initialize an `express` application.
    - Must use `cors` middleware to allow requests from the frontend.
    - Must use `express.json()` middleware to parse JSON request bodies.
    - Must set the server port to `3001`.
    - **Service Initialization:** Must import and instantiate the core services: `FileManager`, `Patcher`, `Indexer`, and `VersionControl`. The `VersionControl` instance must be injected with the `FileManager` and `Patcher` instances.
    - **API Endpoints:**
        - `GET /api/health`: Must return a simple JSON object like `{ status: 'Backend is running!' }`.
        - (Placeholder) `GET /api/document`: A placeholder endpoint to eventually get the current document content via `vc.getCurrentFileContent()`. Must include error handling.
        - (Placeholder) `POST /api/commit`: A placeholder endpoint to commit a new patch. Must parse `patchContent` and `message` from the request body and call `vc.commit()`. Must include error handling.
    - Must start the server by calling `app.listen` on the specified port.

### `/backend/src/core/FileManager.ts`

- **Purpose:** A dedicated module for all file system interactions, abstracting `fs/promises`.
- **Requirements:**
    - **`FileManager` Class:**
        - `fileExists(filePath: string): Promise<boolean>`: Must check for a file's existence using `fs.access` and return a boolean.
        - `createFile(filePath: string, content: string): Promise<void>`: Must write a new file. Must use the `'wx'` flag to prevent overwriting an existing file and must handle the `EEXIST` error code.
        - `openFile(filePath: string): Promise<string>`: Must read a file's content as a 'utf-8' string.
        - `saveFile(filePath: string, content: string): Promise<void>`: Must write content to a file, overwriting it if it exists.
    - **`Grep` Utility:**
        - Must be a separate exported object.
        - `getLines(fileContent: string, startLine: number, endLine: number): string`: Must take a file's full string content and 1-based start/end line numbers. It must split the content by newline, slice the correct range (accounting for 0-based array indexing), and rejoin with newlines. Must gracefully handle invalid or out-of-bounds ranges.

### `/backend/src/core/Patcher.ts`

- **Purpose:** A module to handle the creation and application of diff patches using the `diff` library.
- **Requirements:**
    - **`Patcher` Class:**
        - `applyPatch(originalContent: string, patchContent: string): string`: Must use `diff.applyPatch` to apply a unified diff. If `diff.applyPatch` returns `false` (indicating a failure), this method **must throw an error** with a clear message.
        - `createPatch(oldContent: string, newContent: string, fileName: string): string`: Must use `diff.createTwoFilesPatch` to generate a unified diff string. Must include 3 context lines.

### `/backend/src/core/Indexer.ts`

- **Purpose:** Creates a lightweight, JSON-serializable index of a large document to guide the AI.
- **Requirements:**
    - **`FileIndex` Interface:** Must be exported. Must define:
        - `toc`: An array of objects: `{ heading: string; line: number }`.
        - `symbols`: An array of objects: `{ symbol: string; line: number; section: string }`.
    - **`Indexer` Class:**
        - `generateIndex(fileContent: string): FileIndex`: This is the core method.
            - It must split the `fileContent` into lines and iterate through them, tracking the 1-based `lineNumber`.
            - It must track the `currentSection` by parsing `## Heading` lines.
            - **TOC Logic:** When a line matches a level-2 heading (`## Heading`), it must add an entry to the `toc` array.
            - **Symbol Logic:**
                - Must use regex to find function declarations (e.g., `function myFunc`).
                - Must use regex to find simple JSON keys (e.g., `"key":`) _only_ if the `currentSection` name suggests it's a JSON/Config block.
                - For each found symbol, it must add an entry to the `symbols` array, including the symbol name, line number, and the `currentSection` it was found in.

### `/backend/src/core/VersionControl.ts`

- **Purpose:** A "mini-Git" system that manages document history using patches, not full file copies.
- **Requirements:**
    - **Interfaces:** Must export `Version`, `Branch`, and `HistoryLog` interfaces with the fields specified in the prompt (e.g., `Version` has `id`, `parentId`, `message`, `patchFile`).
    - **`VersionControl` Class:**
        - **Properties:** Must define paths for `.project_meta`, `versions`, `history.log`, and `base.md`.
        - **Constructor:** Must accept `FileManager` and `Patcher` instances via dependency injection.
        - `initialize(initialContent: string): Promise<void>`: Must create meta directories, save the `initialContent` to `baseFile`, and create the first "root" version and "main" branch in a new `history.log` file.
        - `commit(patchContent: string, message: string): Promise<void>`:
            1. Must read the `history.log` using `getHistoryLog`.
            2. Must get the `head` ID of the `currentBranch`.
            3. Must generate a new version ID (e.g., `crypto.randomUUID()`).
            4. Must save the `patchContent` to a new file in the `versionsDir` (e.g., `[new_id].patch`).
            5. Must update the `history.log` by adding the new `Version` object and updating the `currentBranch.head` to the new version ID.
            6. Must save the updated `history.log`.
        - `checkout(versionId: string): Promise<string>`:
            1. Must read `history.log`.
            2. Must build the chain of `Version` objects from the target `versionId` back to the `root` by following `parentId`.
            3. Must reverse this chain to get the correct order (root-to-target).
            4. Must load the content of `baseFile`.
            5. Must iterate through the patch chain, loading each `patchFile` (if it exists) and applying it to the content using `patcher.applyPatch`.
            6. Must return the fully reconstructed file content.
        - `createBranch(branchName: string, fromVersionId: string): Promise<void>`: Must read `history.log`, add a new `Branch` object pointing to `fromVersionId`, and save the log. Must include error handling for existing branch names.
        - `getCurrentFileContent(): Promise<string>`: A helper that reads the log, finds the `head` of the `currentBranch`, and calls `checkout(headId)`.
        - `getHistoryLog(): Promise<HistoryLog>`: A private helper to read and parse the `historyFile`.
            

### `/backend/src/core/Renderer.ts`

- **Purpose:** A placeholder module for future UI rendering logic.
- **Requirements:**
    - **`Renderer` Class:**
        - `renderSection(sectionContent: string): string`: This is a simulation. It should log a "Rendering..." message, escape the input string (for HTML safety), and return it wrapped in `<pre>` tags.
            

## 3. Frontend Directory (`/frontend/`)

### `/frontend/package.json`

- **Purpose:** Defines the frontend React project, its scripts, and dependencies.
- **Requirements:**
    - `"type": "module"`.
    - **Dependencies:** Must include `react` and `react-dom`.
    - **Dev Dependencies:** Must include `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, and ESLint packages.
    - **Scripts:** Must include `dev` (to run `vite`), `build` (to run `tsc && vite build`), `lint`, and `preview`.

### `/frontend/tsconfig.json`

- **Purpose:** Configures TypeScript for the React/Vite project.
- **Requirements:**
    - `target`: Must be `ES2020` or newer.
    - `lib`: Must include `ES2020`, `DOM`, `DOM.Iterable`.
    - `jsx`: Must be `react-jsx`.
    - `module`: Must be `ESNext`.
    - `moduleResolution`: Must be `bundler`.
    - `strict`: Must be `true`.
    - `isolatedModules`: Must be `true`.
    - `noEmit`: Must be `true`.
        

### `/frontend/vite.config.ts`

- **Purpose:** Configures the Vite development server and build process.
- **Requirements:**
    - Must import and use the `react()` plugin.
    - **`server` configuration:**
        - `port`: Must be `3000`.
        - `proxy`: Must be configured to proxy all requests to `/api` to the backend server at `http://localhost:3001`.

### `/frontend/index.html`

- **Purpose:** The HTML entry point for the React application.
- **Requirements:**
    - Must be a standard HTML5 document.
    - Must contain `<div id="root"></div>` in the `<body>`.
    - Must load the React app via `<script type="module" src="/src/main.tsx"></script>`.
        

### `/frontend/src/main.tsx`

- **Purpose:** The main TypeScript entry point that mounts the React app.
- **Requirements:**
    - Must import `React`, `ReactDOM`, and the `App` component.
    - Must use `ReactDOM.createRoot` to render the `<App />` component (wrapped in `<React.StrictMode>`) into the `#root` element.
        

### `/frontend/src/App.tsx`

- **Purpose:** The root component for the React application.
- **Requirements:**
    - Must be a functional component.
    - Must use `useState` to define a `health` state variable, initialized to a "loading" message.
    - Must use `useEffect` (with an empty dependency array `[]`) to run once on component mount.
    - Inside the `useEffect`, it must `fetch('/api/health')`, parse the JSON response, and update the `health` state with the `status` from the backend, or an error message if the fetch fails.
    - Must render a simple UI displaying the app title and the current `health` state.

### `/frontend/src/App.css`

- **Purpose:** A placeholder CSS file for basic styling.
    
- **Requirements:**
    - Must contain basic centering and dark-mode-friendly styles as provided in the original prompt.

### `/frontend/src/vite-env.d.ts`

- **Purpose:** Provides TypeScript type definitions for Vite's client-side environment.
- **Requirements:**
    - Must contain the reference: `/// <reference types="vite/client" />`.
