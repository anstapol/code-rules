# Features pattern

Every entry point (`typescript`, `next-site`, `next-monorepo`, `expo-app`) enforces this structure. The rules live in `typescript.json`, and the framework layers only add bans that their stack needs.

Code is grouped by domain. An app keeps each domain in `features/<domain>/`, whether it is a single Next.js site at the repo root (`next-site`) or an app in a monorepo. A workspace package that shares domains keeps them in `packages/<name>/src/<domain>/`. A domain has only the files and folders it needs.

## Example

```text
features/
  orders/
    actions/
      cancel.ts          server action: validates input, calls server.ts
    components/
      order-list.tsx     exports components only
      order-total.tsx
    hooks.ts             exports use* hooks only
    queries/
      list.ts            reads, may import the database client
    schemas.ts           exports *Schema only
    constants.ts         values only, CONSTANT_CASE names
    helpers.ts           pure functions: no React, no database client
    server.ts            server code and writes, imports the database client
    tools.ts             exports *Tools only, calls defineTool
    types.ts             types only
    helpers.test.ts      tests are exempt from every role rule
```

## Roles

The paths below are the exact patterns the rules match. `features/**` matches a domain at any depth. `src/*` matches a domain one level under a package's `src/`.

| File or folder | Matched paths | May contain | Rule |
| --- | --- | --- | --- |
| `types.ts` | `**/features/**/types.ts`, `**/src/*/types.ts` | `type` and `interface` declarations, imports and type exports. No top-level `function`, `class`, `const`, `let` or `var`. | `types-only` |
| `schemas.ts`, `schemas/` | `**/features/**/schemas.ts`, `**/features/**/schemas/**`, `**/src/*/schemas.ts` | Exported functions and variables must be named `*Schema`. Unexported values and exported types are allowed. | `schemas-only` |
| `hooks.ts`, `hooks.tsx`, `hooks/` | `**/features/**/hooks.ts`, `**/features/**/hooks.tsx`, `**/features/**/hooks/**`, `**/src/*/hooks.ts`, `**/src/*/hooks.tsx` | Exported functions and variables must be named `use` plus a capital letter (`useOrders`). Unexported helpers and exported types are allowed. | `hooks-only` |
| `tools.ts`, `tools/` | `**/features/**/tools.ts`, `**/features/**/tools/**` | Exported functions and variables must be named `*Tools`. No database client import. | `tools-only`, `noRestrictedImports` |
| any other file | everything outside `tools.ts` and `tools/` | No `defineTool(...)` call: model tools are defined only in the domain's tools file. | `define-tool-in-tools` |
| `constants.ts` | `**/constants.ts`, in any folder | Values only. No top-level function declaration and no variable holding an arrow or function expression. Top-level `const` names are `CONSTANT_CASE`. | `no-functions-in-constants`, `useNamingConvention` |
| `helpers.ts`, `helpers/` | `**/features/**/helpers.ts`, `**/features/**/helpers/**`, `**/src/*/helpers.ts`, `**/src/*/helpers/**` | Pure functions. No `react` import and no database client. `next-site` and `next-monorepo` also ban `next/cache`, `next/headers` and `server-only`, and `expo-app` bans `react-native`. | `noRestrictedImports` |
| `components/` | `**/features/*/components/**`, `**/src/*/components/**` | Each file exports React components only: no exported constants, helpers or hooks. | `useComponentExportOnlyModules` |
| `server.ts` | not restricted | Server code and writes. Imports the database client. In a shared package, `server.ts` and `index.ts` may re-export the domain's server and client-safe code. | |
| `queries/`, `queries.ts` | not restricted | Reads. May import the database client. | |
| `actions/` | not restricted | Server actions. May import the database client. | |

The database client is any of `@prisma/client`, `drizzle-orm`, `expo-sqlite`, their subpaths, or an `@<scope>/database/client` import. Only `helpers` and `tools` ban it, so it may be imported anywhere else.

## Everywhere

- `no-type-escapes`: no `as never` or `as unknown` outside tests.
- File names are kebab-case (`useFilenamingConvention`).
- Imports may be relative, `../` included. Route files under `app/` may define their page or handler.

## Tests

Files matching `**/*.{test,spec}.{ts,tsx}`, `**/e2e/**` or `**/test/**` are exempt from every role rule above, except `constants.ts` naming and `no-functions-in-constants`.
