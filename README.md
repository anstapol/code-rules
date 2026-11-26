# @anstapol/code-rules

Strict shared lint, format and compiler config for my TypeScript projects. It ships Biome config, grit rules and a TypeScript `tsconfig`.

The structure it enforces is the features pattern described in [Features pattern](#features-pattern). The pattern is the same in every entry point. Database access, route files and import paths are not restricted beyond it.

It needs Biome 2.5.15 exactly. Biome is a peer dependency, so the project installs it.

## Entry points

| Export | File | What it is |
| --- | --- | --- |
| `@anstapol/code-rules/typescript` | `typescript.json` | The shared layer for any TypeScript project that renders with React or has no UI. Formatter, assist, every stable lint rule, and the features-pattern rules. Safe for a plain React app with no Next.js and no React Native, such as a TanStack Start app. |
| `@anstapol/code-rules/next-monorepo` | `next-monorepo.json` | `typescript` plus Next.js and Turborepo: Next.js domain rules, `process.env` access, default exports where the framework loads them, package entry points, pure helpers without framework I/O, Tailwind class sorting. |
| `@anstapol/code-rules/expo-app` | `expo-app.json` | `typescript` plus Expo and React Native: raw text outside `<Text>`, Expo Router file names and default exports, the global `process` in `env.ts` and `keys.ts`, no `react-native` in helpers, `Pressable` roles, lucide imports by path. |
| `@anstapol/code-rules/tsconfig/strict.json` | `tsconfig/strict.json` | Strict TypeScript compiler options. |

A project extends one Biome entry point. `next-monorepo` and `expo-app` already contain all of `typescript`.

## Strictness policy

Rules come first and code adjusts to them.

- Every stable Biome rule in every group (`a11y`, `complexity`, `correctness`, `performance`, `security`, `style`, `suspicious`) is listed in `typescript.json` and set to `error`, not only the recommended set. `preset` is `none`, so nothing depends on Biome's defaults.
- Each rule with options uses its strictest setting. Numeric limits use the stricter value of the projects this came from: cognitive complexity 10, 60 lines per function (120 in `.tsx`), 4 parameters.
- A rule is turned off or relaxed only for one of three reasons: (a) the stack makes compliance impossible or wrong, (b) two rules in the set contradict each other so no code can satisfy both, or (c) the rule is demonstrably buggy and flags correct code. Taste is not a reason. The relaxation uses the narrowest scope: a rule option, or an `overrides` entry for the file pattern that needs it. Framework relaxations live in `next-monorepo` or `expo-app`. Every case is in the table below with its reason.
- A rule differs between entry points only when the stack forces it. Otherwise all project types share one convention. Structure is never stack-specific: the features pattern lives in `typescript`, and `next-monorepo` and `expo-app` add only rules their framework needs.
- Code that produces many diagnostics is never a reason to relax a rule. That is migration work in the project.
- The nursery group is not turned on as a whole, because nursery rules change between Biome releases. A few nursery rules are picked by name: `noFloatingPromises`, `noMisusedPromises` and `useExhaustiveSwitchCases` in `typescript`, `useSortedClasses` in `next-monorepo`, `noReactNativeRawText` in `expo-app`.
- Domains for frameworks none of these stacks use (`astro`, `qwik`, `solid`, `svelte`, `vue`) are set to `none`.
- Run Biome with `--error-on-warnings`. Every rule is at `error`, so nothing relies on warning level.

`pnpm test` fails when a Biome upgrade adds a stable rule that `typescript.json` does not list, and when a rule is turned off without a row in this README.

### Rules turned off or relaxed

| Rule | Scope | Reason |
| --- | --- | --- |
| `useImportExtensions` | off in every entry point | (a) Bundler-resolved stacks import without extensions. Metro picks `button.ios.tsx` or `button.android.tsx` only for an extensionless specifier, and the rule's fix adds `.ts`, which `tsc` rejects without `allowImportingTsExtensions`. One stack cannot comply, so the convention is the same everywhere: no extensions. |
| `noSecrets` | `entropyThreshold` raised from 41 to 70 | (c) At the default it reports ordinary identifier strings such as `'startOfUtcDay'`, `'toLocaleDateString'` and `'resolveStaleOpenFindingsByRunId'`. At 70 none of those fire, while GitHub, AWS and Slack tokens, JWTs and a random 32-character key still do. A low-entropy key such as `sk_live_…` with 24 random characters is no longer caught: run a secret scanner in CI as well. |
| `useLiteralKeys` | off in `typescript` | (b) Conflicts with `noPropertyAccessFromIndexSignature` in `tsconfig/strict.json`, which requires `record['key']` for index signatures. |
| `noTernary` | off in `typescript` | Style only. JSX has no statement-level conditional, so banning the one conditional expression forces `&&` chains or extra components. `noNestedTernary` stays on. |
| `noJsxLiterals` | off in `typescript` | It exists to force UI text through an i18n catalog. These apps are not localised, and the rule cannot tell product copy from structural text such as punctuation and units. |
| `noJsxPropsBind` | off in `typescript` | React Compiler memoizes inline handlers. The rule pushes `useCallback`, which `noRestrictedImports` bans. |
| `noUnresolvedImports` | off in `typescript` | Biome 2.5.15 misreads `export =` declaration files (it reports that `react` has no `Suspense`) and does not see generated clients. `tsc` checks imports exactly. |
| `noReactSpecificProps` | off in `typescript` | Different framework. It is for Solid and Qwik JSX, and its fix rewrites React's `className` to `class`. |
| `noSolidDestructuredProps`, `useSolidForComponent` | off in `typescript` | Different framework (Solid). They misfire on React components. |
| `noQwikUseVisibleTask`, `useQwikClasslist`, `useQwikMethodUsage`, `useQwikValidLexicalScope` | off in `typescript` | Different framework (Qwik). They misfire on React and test code. |
| `noVueArrowFuncInWatch`, `noVueDataObjectDeclaration`, `noVueDuplicateKeys`, `noVueOptionsApi`, `noVueReservedKeys`, `noVueReservedProps`, `noVueSetupPropsReactivityLoss`, `noVueVIfWithVFor`, `useVueConsistentVBindStyle`, `useVueConsistentVOnStyle`, `useVueDefineMacrosOrder`, `useVueHyphenatedAttributes`, `useVueMultiWordComponentNames`, `useVueVForKey`, `useVueValidTemplateRoot`, `useVueValidVBind`, `useVueValidVCloak`, `useVueValidVElse`, `useVueValidVElseIf`, `useVueValidVHtml`, `useVueValidVIf`, `useVueValidVOn`, `useVueValidVOnce`, `useVueValidVPre`, `useVueValidVText`, `useVueVapor` | off in `typescript` | Different framework (Vue). |
| `noBeforeInteractiveScriptOutsideDocument`, `noDocumentImportInPage`, `noHeadElement`, `noHeadImportInDocument`, `noImgElement`, `noNextAsyncClientComponent`, `noSyncScripts`, `noUnwantedPolyfillio`, `useGoogleFontPreconnect`, `useInlineScriptId` | off in `typescript`, `error` in `next-monorepo` | Next.js rules. A plain React or Expo app has no `next/image` or `next/head` to use instead. |
| `noUndeclaredEnvVars` | off in `typescript`, `error` in `next-monorepo` | Turborepo rule. It checks variables against `turbo.json`, which only the monorepo has. |
| `noExcessiveLinesPerFunction` | 120 lines in `**/*.tsx` | JSX markup puts one attribute per line under the formatter. |
| `useComponentExportOnlyModules` | off outside `**/features/*/components/**` and `**/src/*/components/**` | Part of the features pattern: component folders export components only. Route files, hooks and helpers export other things by design. |
| `noProcessEnv` | off in `**/env.ts`, `**/keys.ts` | These files are where the environment is read and validated. |
| `noCommonJs` | off in `**/*.cjs` | A `.cjs` file is CommonJS by definition. |
| `noDefaultExport`, `noMagicNumbers`, `noProcessEnv` | off in `**/*.config.{ts,mts,cts,js,mjs,cjs}` | Tools load the config's default export. Ports, timeouts and sizes are configuration, and a config reads its environment. |
| `noNodejsModules` | off in config files, `**/scripts/**` and tests | They run in Node. |
| `noConsole`, `noProcessEnv` | off in `**/scripts/**` | A CLI script prints to the terminal and reads its own environment. |
| `noExcessiveLinesPerFunction`, `noMagicNumbers`, `useTopLevelRegex`, `noDefaultExport`, `noProcessEnv` | off in tests (`**/*.{test,spec}.{ts,tsx}`, `**/e2e/**`, `**/test/**`) | A `describe` callback holds the whole suite, fixtures are literal data, assertion patterns sit next to the assertion, test runners load default exports, and tests set up their own environment. |
| `noUndeclaredDependencies` | dev dependencies allowed only in tests, config files, scripts and `.d.ts` files | Tightened, not relaxed: app code may only import `dependencies` and `peerDependencies`. |
| `noProcessEnv`, `noProcessGlobal` | off in `next-monorepo` | Next inlines only the global `process.env.NEXT_PUBLIC_*`. The `no-private-process-env` grit rule replaces them and allows only `NEXT_PUBLIC_*` and `NEXT_RUNTIME` outside `env.ts`, `keys.ts`, config files, `next-config.ts`, `prisma/`, scripts and tests. |
| `noDefaultExport`, `noExportedImports` | off in `**/app/**` in `next-monorepo` and `expo-app` | The router loads each route file's default export, and route files re-export. |
| `noDefaultExport`, `noExportedImports` | off in `**/emails/**`, `**/email/templates/**`, `**/mdx-components.tsx`, `**/mdx-layout.tsx` in `next-monorepo` | React Email and MDX load the default export. |
| `noBarrelFile`, `noReExportAll` | off in `packages/*/src/index.ts`, `packages/*/src/*/index.ts`, `packages/*/src/*/server.ts`, `tooling/*/index.ts` in `next-monorepo` | These are a workspace package's public entry points. A shared feature in `packages/*/src/<feature>/` exposes its client-safe code through `index.ts` and its server code through `server.ts`. |
| `noConsole` | off in `**/prisma/**` in `next-monorepo` | Seed scripts print progress. |
| `noDefaultExport`, `noMagicNumbers` | off in `**/next-config.ts` in `next-monorepo` | A shared Next config factory, loaded like a config file. |
| `noNodejsModules` | off in `next-monorepo` outside `**/components/**` and hooks | Server code in Next runs in Node. Components and hooks can reach the client bundle. |
| `noUndeclaredVariables` | `PageProps`, `LayoutProps`, `RouteContext` declared as globals in `next-monorepo` | Next generates these global types in `.next/types`, which Biome does not read. |
| `useFilenamingConvention` | off in `**/app/**` in `expo-app` | Expo Router file names are fixed: `_layout.tsx`, `[id].tsx`, `+html.tsx`, `(tabs)`. |
| `noProcessGlobal` | off in `**/env.ts`, `**/keys.ts` in `expo-app` | Expo inlines only the global `process.env.EXPO_PUBLIC_*`. |

### Rules kept on after review

These looked like conflicts or false positives and are not:

| Rule | Why it stays on |
| --- | --- |
| `noVoid` with `noFloatingPromises` | Both can be satisfied. An intentionally un-awaited promise handles its rejection: `save(value).catch(logFailure)`. `noFloatingPromises` accepts that, and nothing needs `void`. `pnpm test` checks it. |
| `useExportsLast` | Taste, and code can always comply: declare helpers and components above the exports. |
| `noImplicitBoolean` | Taste, and code can always comply: write `disabled={true}`. |
| `noAwaitInLoops` | Sequential work is written as a `reduce` over a promise, or a helper such as `inSequence(items, run)`, so the order is explicit. |

## Formatter and assist

All three entry points format the same way: 2 spaces, LF, 100 columns, single quotes in JS and double in JSX and CSS, semicolons, no trailing commas, parentheses around every arrow parameter, one JSX attribute per line, `formatWithErrors` off, and `.editorconfig` ignored so it cannot loosen anything.

Assist sorts imports, object and JSON keys, JSX attributes, interface and type members and CSS properties, and removes duplicate classes. `biome check` reports anything unsorted. `next-monorepo` also sorts Tailwind classes.

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
| `helpers.ts`, `helpers/` | Pure functions: no React and no database client. `next-monorepo` also bans `next/cache`, `next/headers` and `server-only`, `expo-app` bans `react-native`. | `noRestrictedImports` |
| `server.ts` | Server code and writes. The database client is imported here, in `queries/` and in `actions/`. | |
| `tools.ts`, `tools/` | Model tools. Exports end in `Tools`, no database client. `defineTool` is called only here. | `tools-only`, `define-tool-in-tools`, `noRestrictedImports` |
| `types.ts` | Types only. | `types-only` |

The role rules match by path: `**/features/**/<file>` and `**/src/*/<file>`, except `constants.ts`, which counts anywhere. Tests are excluded. The database client is `@prisma/client`, `drizzle-orm`, `expo-sqlite` or any `@*/database/client` import.

Imports may be relative, `../` included. Route files under `app/` may define their page or handler. Neither is restricted in any entry point.

Other shared conventions in `typescript`: no `dayjs` or `moment` (use `date-fns`), no `lodash` or `underscore`, no `memo`, `useCallback` or `useMemo` (React Compiler memoizes), no inline style objects, one `variant="primary"` button per returned screen, kebab-case file names.

### Opt-in rules

These grit rules ship in `rules/` but no entry point turns them on. They encode one project's design system or layout, so a project that wants one adds it in its own `biome.json` for the paths it chooses:

| Rule | What it reports |
| --- | --- |
| `routes-only` | Anything but re-exports in a route file. |
| `no-raw-colors` | Colour literals outside the theme. |
| `no-raw-numbers` | Number literals inside object literals, such as sizes and timings. |
| `no-raw-primitives` | React Native primitives outside the UI kit. |
| `danger-in-kit` | Danger styling outside the UI kit and theme. |

```json
{
  "extends": ["@anstapol/code-rules/expo-app"],
  "overrides": [
    {
      "includes": ["**/app/**"],
      "plugins": ["./node_modules/@anstapol/code-rules/rules/routes-only.grit"]
    }
  ]
}
```

## Strict TypeScript

Extend the strict config from the project's `tsconfig.json`, after the framework's own base:

```json
{
  "extends": ["expo/tsconfig.base.json", "@anstapol/code-rules/tsconfig/strict.json"]
}
```

It turns on `strict` plus `allowUnreachableCode: false`, `allowUnusedLabels: false`, `checkJs`, `erasableSyntaxOnly`, `exactOptionalPropertyTypes`, `forceConsistentCasingInFileNames`, `isolatedModules`, `moduleDetection: force`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `noUncheckedIndexedAccess`, `noUncheckedSideEffectImports`, `noUnusedLocals`, `noUnusedParameters` and `verbatimModuleSyntax`. All are accepted by TypeScript 6.0 and 7.0.

It sets no `target`, `module`, `lib`, `jsx` or `paths`; those belong to the framework base. Imports have no extensions, so neither `allowImportingTsExtensions` nor `rewriteRelativeImportExtensions` is needed. `isolatedDeclarations` is left out because it needs `declaration` output; a published library should add it.

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

[CHANGELOG.md](CHANGELOG.md) lists the rules a Next app no longer gets and the three changes that can report code that passed v0.1.0.

### Moving from `@anstapol/biome-config`

Replace the dependency with `@anstapol/code-rules` and change `extends` from `@anstapol/biome-config/base` to `@anstapol/code-rules/typescript`. The `base` entry point no longer exists. Suppression comments keep working: grit rules are still reported as `lint/plugin`.

## Local overrides

Anything in the project's `biome.json` is applied after the entry point.

- `overrides` and `plugins` add to the shared ones.
- Setting a rule replaces the shared setting with all its options. To add one path to `noRestrictedImports`, copy the shared `paths` and `patterns` too, or the shared ones are lost.
- Keep the same bar as the shared config: relax a rule only where the stack requires it, for the narrowest file pattern, with a comment saying why.

```json
{
  "extends": ["@anstapol/code-rules/typescript"],
  "overrides": [
    {
      "includes": ["src/routes/**"],
      "linter": {
        "rules": {
          "style": { "noDefaultExport": "off" }
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

1. Write the grit rule in `rules/<name>.grit`. Each `register_diagnostic` message says what to do instead.
2. Turn it on in `src/typescript.json` if any TypeScript project should follow it, otherwise in `src/next-monorepo.json` or `src/expo-app.json` when it depends on that stack. Reference it as `./node_modules/@anstapol/code-rules/rules/<name>.grit`, usually inside an override with `includes`.
3. Add two fixtures, laid out as files in a consumer project:
   - `test/cases/<name>/fail/...` must report the rule's message.
   - `test/cases/<name>/pass/...` must lint clean under every entry point that ships the rule.
4. Add the rule name to the entry points it belongs to in `test/run.js`.
5. Run `pnpm build` and `pnpm test`.

For a core Biome rule, edit the `src/` file and run `pnpm build`. Turning one off needs a row in the table above, or the test fails.

## Test

```bash
pnpm install
pnpm test
```

The test installs this package from its local path into a temporary project and checks that:

- every built entry point parses and loads in Biome;
- `typescript.json` lists every stable rule, and every rule it turns off has a row in this README;
- an ordinary React component (`className`, a text child, a hook) passes `biome check` under `typescript` and `next-monorepo`, and `biome check --write --unsafe` leaves it unchanged;
- a fire-and-forget call handled with `.catch()` passes under every entry point, so `noVoid` and `noFloatingPromises` can both be satisfied;
- a small feature with relative imports, the database client in `server.ts` and a page component in a route file passes under every entry point (the route file under `next-monorepo` and `expo-app`);
- a helper that imports the database client is reported under every entry point;
- each opt-in rule is off in every entry point and reports its fail fixture once a project adds it;
- each fail fixture reports its rule and each pass fixture lints clean under every entry point that ships the rule.

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
