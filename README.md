# @anstapol/code-rules

Shared lint, format and compiler config for my TypeScript projects. It ships Biome config, grit rules and a TypeScript `tsconfig`.

Every entry point enforces the same project structure, the [features pattern](#features-pattern). Beyond it, the rules are those of one reference Next.js monorepo that passes them with zero diagnostics.

It needs Biome 2.5.15 exactly. Biome is a peer dependency, so the project installs it.

## Entry points

| Export | File | What it is |
| --- | --- | --- |
| `@anstapol/code-rules/typescript` | `typescript.json` | The shared base for any TypeScript project: formatter, assist, the recommended rules plus a named set, and the features pattern. Safe for a plain React app with no Next.js and no React Native. |
| `@anstapol/code-rules/next-monorepo` | `next-monorepo.json` | `typescript` plus Next.js and Turborepo: `process.env` access, pure helpers without framework I/O, default exports where Next, React Email and MDX load them, workspace package entry points, Tailwind class sorting. |
| `@anstapol/code-rules/expo-app` | `expo-app.json` | `typescript` plus Expo and React Native: raw text outside `<Text>`, Expo Router file names and default exports, no `react-native` in helpers, `Pressable` roles, lucide imports by path. |
| `@anstapol/code-rules/tsconfig/strict.json` | `tsconfig/strict.json` | `strict`, `isolatedModules` and `moduleDetection: force`. |

A project extends one Biome entry point. `next-monorepo` and `expo-app` already contain all of `typescript`.

## Rule policy

- The base is Biome's `recommended` preset plus a named list of rules at `error`, the same set the reference project runs. Nothing in this package reports code that the reference project accepts.
- Tightening happens one step at a time. A later tag turns on one rule or one compiler flag, and the reference project fixes its code in the same cycle. A tag never adds several at once.
- Structure is the same in every entry point. `next-monorepo` and `expo-app` add only what their framework needs, never a different layout.
- A rule is relaxed only for a file pattern whose framework requires it, and every relaxation is in the table below.
- Run Biome with `--error-on-warnings`.

### Rules turned on beyond `recommended`

`typescript` turns these on at `error`:

- `complexity`: `noExcessiveCognitiveComplexity` (15), `noExcessiveLinesPerFunction` (60, 120 in `.tsx`), `noImplicitCoercions`, `noUselessCatchBinding`, `noUselessFragments`, `noUselessReturn`, `noUselessUndefined`, `useMaxParams`, `useSimplifiedLogicExpression`.
- `correctness`: `noNestedComponentDefinitions`, `noReactPropAssignments`, `noUndeclaredDependencies`, `noUnusedFunctionParameters`, `noUnusedImports`, `noUnusedVariables`.
- `nursery`: `noFloatingPromises`, `noMisusedPromises`, `useExhaustiveSwitchCases`. `next-monorepo` adds `useSortedClasses` and `expo-app` adds `noReactNativeRawText`.
- `performance`: `noBarrelFile`, `noNamespaceImport`, `noReExportAll`, `useTopLevelRegex`.
- `security`: `noDangerouslySetInnerHtml`.
- `style`: `noDefaultExport`, `noExportedImports`, `noIncrementDecrement`, `noMagicNumbers`, `noNestedTernary`, `noNonNullAssertion`, `noParameterAssign`, `noRestrictedImports` (no `memo`, `useCallback` or `useMemo`, because React Compiler memoizes), `useAtIndex`, `useBlockStatements`, `useConsistentArrayType`, `useConsistentArrowReturn`, `useConsistentObjectDefinitions`, `useConsistentTypeDefinitions` (`type`), `useDestructuring`, `useErrorCause`, `useExportType`, `useFilenamingConvention` (kebab-case), `useImportType`, `useNamingConvention`, `useObjectSpread`, `useReactFunctionComponents`, `useUnifiedTypeSignatures`.
- `suspicious`: `noBitwiseOperators`, `noConsole` (allows `console.error` and `console.warn`), `noDeprecatedImports`, `noDuplicatedSpreadProps`, `noDuplicateTestHooks`, `noEqualsToNull`, `noEvolvingTypes`, `noExplicitAny`, `noExportsInTest`, `noFocusedTests`, `noImportCycles`, `noLeakedRender`, `noMisplacedAssertion`, `noParametersOnlyUsedInRecursion`, `noReturnAssign`, `noShadow`, `noSkippedTests`, `noTsIgnore`, `noUnnecessaryConditions`, `useArraySortCompare`, `useAwait`, `useGuardForIn`.

### Relaxations

| Rule | Scope | Reason |
| --- | --- | --- |
| `noExcessiveLinesPerFunction` | 120 lines in `**/*.tsx` | JSX markup puts one attribute per line under the formatter. |
| `noDefaultExport`, `noMagicNumbers` | off in `**/*.config.{ts,mts,cts,js,mjs,cjs}` | Tools load the config's default export, and ports, timeouts and sizes are configuration. |
| `noConsole`, `noMagicNumbers` | off in `**/scripts/**` | A CLI script prints to the terminal. |
| `noExcessiveLinesPerFunction`, `noMagicNumbers`, `useTopLevelRegex`, `noDefaultExport` | off in tests (`**/*.{test,spec}.{ts,tsx}`, `**/e2e/**`, `**/test/**`) | A `describe` callback holds the whole suite, fixtures are literal data, assertion patterns sit next to the assertion, and test runners load default exports. Tests also declare the Jest globals (`describe`, `it`, `test`, `expect`, `jest` and the hooks). |
| `noDefaultExport`, `noExportedImports` | off in `**/app/**`, `**/emails/**`, `**/email/templates/**`, `**/mdx-components.tsx`, `**/mdx-layout.tsx` in `next-monorepo` | Next, React Email and MDX load the default export, and route files re-export. |
| `noBarrelFile`, `noReExportAll` | off in `packages/*/src/index.ts`, `packages/*/src/*/index.ts`, `packages/*/src/*/server.ts`, `tooling/*/index.ts` in `next-monorepo` | A workspace package's public entry points. A shared feature in `packages/*/src/<feature>/` exposes client-safe code through `index.ts` and server code through `server.ts`. |
| `noConsole` | off in `**/prisma/**` in `next-monorepo` | Seed scripts print progress. |
| `noDefaultExport`, `noMagicNumbers` | off in `**/next-config.ts` in `next-monorepo` | A shared Next config factory, loaded like a config file. |
| `noDefaultExport`, `noExportedImports`, `useFilenamingConvention` | off in `**/app/**` in `expo-app` | Expo Router loads the default export, and its file names are fixed: `_layout.tsx`, `[id].tsx`, `+html.tsx`, `(tabs)`. |

`next-monorepo` reads the environment through the `no-private-process-env` grit rule: outside `env.ts`, `keys.ts`, config files, `next-config.ts`, `prisma/`, scripts and tests, only `process.env.NEXT_PUBLIC_*` and `process.env.NEXT_RUNTIME` may be read directly.

## Formatter and assist

All entry points format the same way: 2 spaces, LF, 100 columns, single quotes in JS and double in JSX, semicolons, no trailing commas, one JSX attribute per line. Assist sorts imports, object and JSON keys and JSX attributes, and `biome check` reports anything unsorted. `next-monorepo` also sorts Tailwind classes.

## Features pattern

Each app keeps its code in `features/<feature>/`. A workspace package that shares features keeps them in `packages/<name>/src/<feature>/`. A feature holds the files and folders it needs, from this list:

| File or folder | Role | Enforced by |
| --- | --- | --- |
| `actions/` | Server actions. | |
| `components/` | React components. Each file exports components only. | `useComponentExportOnlyModules` |
| `hooks.ts`, `hooks.tsx`, `hooks/` | Exports are `use*` hooks. | `hooks-only` |
| `queries/` or `queries.ts` | Reads. | |
| `schemas.ts`, `schemas/` | Exports end in `Schema`. | `schemas-only` |
| `constants.ts` | Values only, `CONSTANT_CASE` names. | `no-functions-in-constants`, `useNamingConvention` |
| `helpers.ts`, `helpers/` | Pure functions: no React and no database client. `next-monorepo` also bans `next/cache`, `next/headers` and `server-only`, and `expo-app` bans `react-native`. | `noRestrictedImports` |
| `server.ts` | Server code and writes. The database client is imported here, in `queries/` and in `actions/`. | |
| `tools.ts`, `tools/` | Model tools. Exports end in `Tools`, no database client. `defineTool` is called only here. | `tools-only`, `define-tool-in-tools`, `noRestrictedImports` |
| `types.ts` | Types only. | `types-only` |

The role rules match by path: `**/features/**/<file>` and `**/src/*/<file>`, except `constants.ts`, which counts anywhere. Tests are excluded. The database client is `@prisma/client`, `drizzle-orm`, `expo-sqlite` or any `@*/database/client` import.

`no-type-escapes` applies to all code outside tests. Imports may be relative, `../` included, and route files under `app/` may define their page or handler.

## Strict TypeScript

Extend the strict config from the project's `tsconfig.json`, after the framework's own base:

```json
{
  "extends": ["expo/tsconfig.base.json", "@anstapol/code-rules/tsconfig/strict.json"]
}
```

It turns on `strict`, `isolatedModules` and `moduleDetection: force`. It sets no `target`, `module`, `lib`, `jsx` or `paths`; those belong to the framework base. Further flags follow the rule policy: one per tag.

## Install

Add it as a git dependency pinned to a tag, next to Biome:

```bash
pnpm add -D @biomejs/biome@2.5.15 "@anstapol/code-rules@github:anstapol/code-rules#v0.2.0"
```

Then extend one entry point in the project's root `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.15/schema.json",
  "extends": ["@anstapol/code-rules/next-monorepo"],
  "files": {
    "includes": ["**", "!**/*.gen.ts"]
  }
}
```

The package does not set `files`, so each project lists what Biome should read. Run it with `biome check --error-on-warnings .`.

### Where `biome.json` must live

The grit rules are referenced as `./node_modules/@anstapol/code-rules/rules/<rule>.grit`. Biome 2.5.15 resolves plugin paths in an extended config from the project's root config, not from the config that declares them. So the root `biome.json` must sit next to a `node_modules` folder that contains this package. In a pnpm workspace, add it to the root `package.json`.

### Moving from v0.1.0

[CHANGELOG.md](CHANGELOG.md) lists what was removed and the changes that can report code that passed v0.1.0.

### Moving from `@anstapol/biome-config`

Replace the dependency with `@anstapol/code-rules` and change `extends` from `@anstapol/biome-config/base` to `@anstapol/code-rules/typescript`. The `base` entry point no longer exists. Suppression comments keep working: grit rules are still reported as `lint/plugin`.

## Local overrides

Anything in the project's `biome.json` is applied after the entry point.

- `overrides` and `plugins` add to the shared ones.
- Setting a rule replaces the shared setting with all its options. To add one path to `noRestrictedImports`, copy the shared `paths` and `patterns` too, or the shared ones are lost.
- Relax a rule only where the project requires it, for the narrowest file pattern, with a comment saying why.

```json
{
  "extends": ["@anstapol/code-rules/next-monorepo"],
  "overrides": [
    {
      "includes": ["packages/assets/src/*.js"],
      "linter": {
        "rules": {
          "suspicious": { "noConsole": "off" }
        }
      }
    }
  ]
}
```

A shared grit rule cannot be switched off for a path in config. Suppress it in the file instead, with a reason:

```ts
// biome-ignore-all lint/plugin/no-private-process-env: this script runs in Node at build time
```

## How the entry points are built

Biome 2.5.15 ignores `extends` inside a config that is itself extended, so `next-monorepo.json` cannot extend `typescript.json`. The sources live in `src/`, and `pnpm build` writes each entry point out flat at the repo root: `src/typescript.json` merged with the type file. The merge follows Biome's own: `overrides` and `plugins` add up, a rule set in the type file replaces the shared rule, other objects merge.

Never edit the root `typescript.json`, `next-monorepo.json` or `expo-app.json` by hand. `pnpm test` fails when they are stale.

## Add or change a rule

Follow the rule policy: one new rule per tag, after the reference project passes it.

1. For a grit rule, write `rules/<name>.grit`. Each `register_diagnostic` message says what to do instead.
2. Turn it on in `src/typescript.json` if every project should follow it, otherwise in `src/next-monorepo.json` or `src/expo-app.json` when it depends on that framework. Reference a grit rule as `./node_modules/@anstapol/code-rules/rules/<name>.grit`, usually inside an override with `includes`.
3. For a grit rule, add two fixtures laid out as files in a consumer project:
   - `test/cases/<name>/fail/...` must report the rule's message.
   - `test/cases/<name>/pass/...` must lint clean under every entry point that ships the rule.
4. Add the rule name to the entry points it belongs to in `test/run.js`.
5. Run `pnpm build` and `pnpm test`, and add the rule to `CHANGELOG.md`.

## Test

```bash
pnpm install
pnpm test
```

The test installs this package from its local path into a temporary project and checks that:

- every built entry point parses and loads in Biome;
- `typescript.json` uses the recommended preset and declares the Jest globals in tests;
- an ordinary React component (`className`, a text child, a hook) passes `biome check` under `typescript` and `next-monorepo`, and `biome check --write --unsafe` leaves it unchanged;
- a fire-and-forget call handled with `.catch()` passes under every entry point;
- a small feature with relative imports, the database client in `server.ts` and a page component in a route file passes under every entry point (the route file under `next-monorepo` and `expo-app`);
- a helper that imports the database client is reported under every entry point;
- each grit rule's fail fixture reports its message and its pass fixture lints clean under every entry point that ships the rule.

It needs `git` and `pnpm` on the path.

## Release a tag

1. Run `pnpm build` and `pnpm test`.
2. Bump `version` in `package.json`, add the release to `CHANGELOG.md`, and commit both as `chore: release v0.2.0`.
3. Tag and push the tag:

```bash
git tag v0.2.0
git push origin main v0.2.0
```

4. In each project, update the `#v0.2.0` in the dependency and run `pnpm install`.

A change that makes existing code fail lint is a minor version while the package is below 1.0, and a major one after.
