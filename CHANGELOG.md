# Changelog

## v0.2.0

The features pattern is the one structure every entry point enforces, and it lives in `typescript`. `next-monorepo` and `expo-app` add only what their framework needs.

### Removed

- The ban on `../` imports, in every entry point.
- The rule that only `db/`, `database/` and repositories import the database client, in every entry point.
- `routes-only` from `next-monorepo` and `expo-app`. Route files may define their page or handler.
- `useComponentExportOnlyModules` outside component folders. It now applies to `**/features/*/components/**` and `**/src/*/components/**` in every entry point.
- From `expo-app`: `no-raw-colors`, `no-raw-numbers`, `no-raw-primitives`, `danger-in-kit`, the ban on `StyleSheet`, `useColorScheme` and the other theme APIs from `react-native`, and the ban on `expo-*` imports in helpers.
- The `useAwait` relaxation for `**/actions.ts` and `**/actions/**` in `next-monorepo`.

`routes-only`, `no-raw-colors`, `no-raw-numbers`, `no-raw-primitives` and `danger-in-kit` still ship in `rules/` as opt-in rules. See the README.

### Changed

- Line width is 100 columns, up from 80. `formatter.expand` is no longer set, so `package.json` keeps Biome's own layout.
- Role rules match by path inside a feature: `**/features/**/<file>` and `**/src/*/<file>`. `types/**` is no longer a role folder. `constants.ts` still counts anywhere.
- Helpers and `tools.ts` may not import the database client: `@prisma/client`, `drizzle-orm`, `expo-sqlite` or `@*/database/client`.
- `no-private-process-env` no longer applies to config files, `next-config.ts`, `prisma/`, scripts or tests.
- `noBarrelFile` and `noReExportAll` are off in workspace package entry points (`packages/*/src/index.ts`, `packages/*/src/*/index.ts`, `packages/*/src/*/server.ts`, `tooling/*/index.ts`) in `next-monorepo`.
- `noDefaultExport` and `noExportedImports` are off in `**/email/templates/**`, `**/mdx-components.tsx` and `**/mdx-layout.tsx` in `next-monorepo`. `noConsole` is off in `**/prisma/**`, and `noDefaultExport` and `noMagicNumbers` are off in `**/next-config.ts`.
- `noMagicNumbers` and `noProcessEnv` are off in config files. `noDefaultExport` and `noProcessEnv` are off in tests.

### Can report code that passed v0.1.0

- Lines up to 100 columns are joined by the formatter. Run `biome check --write`.
- `useAwait` now reports a server action with nothing to await.
- A `tools.ts` that imports the database client is reported, and so is a helper that imports `drizzle-orm`, `expo-sqlite` or `@prisma/client`.

## v0.1.0

First release: `typescript`, `next-monorepo` and `expo-app` Biome entry points with every stable rule at `error`, grit rules and `tsconfig/strict.json`.
