# Changelog

## v0.2.0

The features pattern is now the structure `typescript` and `next-monorepo` enforce. Rules that came from one project's layout and do not belong to that pattern moved to `expo-app` or were removed.

### Removed from `typescript` and `next-monorepo`

- The ban on `../` imports. Relative imports are allowed. `expo-app` keeps the ban.
- The rule that only `db/`, `database/` and repositories import the database client. `expo-app` keeps it.
- `routes-only` in `next-monorepo`. Next route files may define their page or handler. `expo-app` keeps it.
- `useComponentExportOnlyModules` outside component folders. It now applies to `**/features/*/components/**` and `**/src/*/components/**`. `expo-app` keeps it everywhere.
- The `useAwait` relaxation for `**/actions.ts` and `**/actions/**` in `next-monorepo`.

### Changed

- Line width is 100 columns, up from 80. `formatter.expand` is no longer set, so `package.json` keeps Biome's own layout.
- Role rules match by path inside a feature: `**/features/**/<file>` and `**/src/*/<file>`. `types/**` is no longer a role folder. `constants.ts` still counts anywhere.
- `tools.ts` and `tools/` may not import the database client.
- `no-private-process-env` no longer applies to config files, `next-config.ts`, `prisma/`, scripts or tests.
- `noBarrelFile` and `noReExportAll` are off in workspace package entry points (`packages/*/src/index.ts`, `packages/*/src/*/index.ts`, `packages/*/src/*/server.ts`, `tooling/*/index.ts`) in `next-monorepo`.
- `noDefaultExport` and `noExportedImports` are off in `**/email/templates/**`, `**/mdx-components.tsx` and `**/mdx-layout.tsx` in `next-monorepo`. `noConsole` is off in `**/prisma/**`, and `noDefaultExport` and `noMagicNumbers` are off in `**/next-config.ts`.
- `noMagicNumbers` and `noProcessEnv` are off in config files. `noDefaultExport` and `noProcessEnv` are off in tests.

### Can report code that passed v0.1.0

- Lines up to 100 columns are joined by the formatter. Run `biome check --write`.
- `useAwait` now reports a server action with nothing to await.
- A `tools.ts` that imports the database client is reported.

## v0.1.0

First release: `typescript`, `next-monorepo` and `expo-app` Biome entry points with every stable rule at `error`, grit rules and `tsconfig/strict.json`.
