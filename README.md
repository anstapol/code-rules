# @anstapol/code-rules

Strict shared lint, format and compiler config for my TypeScript projects. It ships Biome config, grit rules and a TypeScript `tsconfig`.

It needs Biome 2.5.15 exactly. Biome is a peer dependency, so the project installs it.

## Entry points

| Export | File | What it is |
| --- | --- | --- |
| `@anstapol/code-rules/typescript` | `typescript.json` | The shared layer for any TypeScript project that renders with React or has no UI. Formatter, assist, every stable lint rule, and the role-file rules. Safe for a plain React app with no Next.js and no React Native, such as a TanStack Start app. |
| `@anstapol/code-rules/next-monorepo` | `next-monorepo.json` | `typescript` plus Next.js and Turborepo: Next.js domain rules, `process.env` access, route files, server actions, Tailwind class sorting. |
| `@anstapol/code-rules/expo-app` | `expo-app.json` | `typescript` plus Expo and React Native: route files, theme colours and numbers, the kit in `features/ui`, `Pressable` roles, lucide imports, Unistyles. |
| `@anstapol/code-rules/tsconfig/strict.json` | `tsconfig/strict.json` | Strict TypeScript compiler options. |
| `@anstapol/code-rules/base` | `base.json` | Deprecated. A copy of `typescript.json` kept for projects that still extend `base`. Switch to `typescript`; `base` will be removed. |

A project extends one Biome entry point. `next-monorepo` and `expo-app` already contain all of `typescript`.

## Strictness policy

Rules come first and code adjusts to them.

- Every stable Biome rule in every group (`a11y`, `complexity`, `correctness`, `performance`, `security`, `style`, `suspicious`) is listed in `typescript.json` and set to `error`, not only the recommended set. `preset` is `none`, so nothing depends on Biome's defaults.
- Each rule with options uses its strictest setting. Numeric limits use the stricter value of the projects this came from: cognitive complexity 10, 60 lines per function (120 in `.tsx`), 4 parameters.
- A rule is turned off or relaxed only when the stack makes compliance impossible or wrong, and only at the narrowest scope: an `overrides` entry for the file pattern that needs it. Framework relaxations live in `next-monorepo` or `expo-app`. Every case is in the table below with its reason.
- Code that produces many diagnostics is never a reason to relax a rule. That is migration work in the project.
- The nursery group is not turned on as a whole, because nursery rules change between Biome releases. A few nursery rules are picked by name: `noFloatingPromises`, `noMisusedPromises` and `useExhaustiveSwitchCases` in `typescript`, `useSortedClasses` in `next-monorepo`, `noReactNativeRawText` in `expo-app`.
- Domains for frameworks none of these stacks use (`astro`, `qwik`, `solid`, `svelte`, `vue`) are set to `none`.
- Run Biome with `--error-on-warnings`. Every rule is at `error`, so nothing relies on warning level.

`pnpm test` fails when a Biome upgrade adds a stable rule that `typescript.json` does not list, and when a rule is turned off without a row in this README.

### Rules turned off or relaxed

| Rule | Scope | Reason |
| --- | --- | --- |
| `useLiteralKeys` | off in `typescript` | Conflicts with `noPropertyAccessFromIndexSignature` in `tsconfig/strict.json`, which requires `record['key']` for index signatures. |
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
| `noProcessEnv` | off in `**/env.ts`, `**/keys.ts` | These files are where the environment is read and validated. |
| `noCommonJs` | off in `**/*.cjs` | A `.cjs` file is CommonJS by definition. |
| `noDefaultExport` | off in `**/*.config.{ts,mts,cts,js,mjs,cjs}` | Tools load the config's default export. |
| `noNodejsModules` | off in config files, `**/scripts/**` and tests | They run in Node. |
| `noConsole`, `noProcessEnv` | off in `**/scripts/**` | A CLI script prints to the terminal and reads its own environment. |
| `noExcessiveLinesPerFunction`, `noMagicNumbers`, `useTopLevelRegex` | off in tests (`**/*.{test,spec}.{ts,tsx}`, `**/e2e/**`, `**/test/**`) | A `describe` callback holds the whole suite, fixtures are literal data, assertion patterns sit next to the assertion. |
| `noUndeclaredDependencies` | dev dependencies allowed only in tests, config files, scripts and `.d.ts` files | Tightened, not relaxed: app code may only import `dependencies` and `peerDependencies`. |
| `noRestrictedImports` | replaced in `**/db/**`, `**/database/**`, `**/repositories.ts`, `**/repositories/**` | The database layer is the one place that imports the database client. |
| `noProcessEnv`, `noProcessGlobal` | off in `next-monorepo` | Next inlines only the global `process.env.NEXT_PUBLIC_*`. The `no-private-process-env` grit rule replaces them and allows only `NEXT_PUBLIC_*` and `NEXT_RUNTIME` outside `env.ts`, `keys.ts` and scripts. |
| `noDefaultExport`, `noExportedImports` | off in `**/app/**` in `next-monorepo` and `expo-app` | The router loads each route file's default export, and route files re-export. |
| `useComponentExportOnlyModules` | allows Next's segment and metadata exports in `**/app/**` | Next reads `metadata`, `generateMetadata`, `revalidate`, `alt`, `size`, `contentType` and the other segment exports from the route file itself. |
| `noDefaultExport` | off in `**/emails/**` in `next-monorepo` | React Email loads each template's default export. |
| `useAwait` | off in `**/actions.ts`, `**/actions/**` in `next-monorepo` | Next requires every server action to be `async`, even one with nothing to await. |
| `noNodejsModules` | off in `next-monorepo` outside `**/components/**` and hooks | Server code in Next runs in Node. Components and hooks can reach the client bundle. |
| `noUndeclaredVariables` | `PageProps`, `LayoutProps`, `RouteContext` declared as globals in `next-monorepo` | Next generates these global types in `.next/types`, which Biome does not read. |
| `useImportExtensions` | off in `expo-app` | Metro picks `button.ios.tsx` or `button.android.tsx` only for an extensionless specifier. |
| `useFilenamingConvention` | off in `**/app/**` in `expo-app` | Expo Router file names are fixed: `_layout.tsx`, `[id].tsx`, `+html.tsx`, `(tabs)`. |
| `useComponentExportOnlyModules` | allows `ErrorBoundary`, `generateStaticParams`, `unstable_settings` in `**/app/**` in `expo-app` | Expo Router reads these from the route file. |
| `noProcessGlobal` | off in `**/env.ts`, `**/keys.ts` in `expo-app` | Expo inlines only the global `process.env.EXPO_PUBLIC_*`. |

## Formatter and assist

All three entry points format the same way: 2 spaces, LF, 80 columns, single quotes in JS and double in JSX and CSS, semicolons, no trailing commas, parentheses around every arrow parameter, one JSX attribute per line, `formatWithErrors` off, and `.editorconfig` ignored so it cannot loosen anything.

Assist sorts imports, object and JSON keys, JSX attributes, interface and type members and CSS properties, and removes duplicate classes. `biome check` reports anything unsorted. `next-monorepo` also sorts Tailwind classes.

## Role files

These rules apply wherever a file with the role's name sits, in every project type, tests excluded:

| File | Rule |
| --- | --- |
| `constants.ts` | Values only, `CONSTANT_CASE` names (`no-functions-in-constants`). |
| `types.ts`, `types/**` | Types only (`types-only`). |
| `schemas.ts`, `schemas/**` | Exports end in `Schema` (`schemas-only`). |
| `hooks.ts`, `hooks.tsx`, `hooks/**` | Exports are `use*` hooks (`hooks-only`). |
| `helpers.ts`, `helpers/**` | No React, framework I/O, database or repositories imports. |
| `tools.ts`, `tools/**` | Exports end in `Tools` (`tools-only`). `defineTool` is called only here (`define-tool-in-tools`). |
| `**/app/**` | Route files only re-export (`routes-only`), in `next-monorepo` and `expo-app`. |

Other shared conventions in `typescript`: no `../` imports (use the `@/` alias), no `dayjs` or `moment` (use `date-fns`), no `lodash` or `underscore`, the database client only in `db/`, `database/` or repositories, no `memo`, `useCallback` or `useMemo` (React Compiler memoizes), no inline style objects, one `variant="primary"` button per returned screen, kebab-case file names.

## Strict TypeScript

Extend the strict config from the project's `tsconfig.json`, after the framework's own base:

```json
{
  "extends": ["expo/tsconfig.base.json", "@anstapol/code-rules/tsconfig/strict.json"]
}
```

It turns on `strict` plus `allowUnreachableCode: false`, `allowUnusedLabels: false`, `checkJs`, `erasableSyntaxOnly`, `exactOptionalPropertyTypes`, `forceConsistentCasingInFileNames`, `isolatedModules`, `moduleDetection: force`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `noUncheckedIndexedAccess`, `noUncheckedSideEffectImports`, `noUnusedLocals`, `noUnusedParameters` and `verbatimModuleSyntax`. All are accepted by TypeScript 6.0 and 7.0.

It sets no `target`, `module`, `lib`, `jsx` or `paths`; those belong to the framework base. `useImportExtensions` wants explicit extensions on relative and alias imports, so a bundled app also sets `allowImportingTsExtensions` with `noEmit`, and a library that emits sets `rewriteRelativeImportExtensions`. `isolatedDeclarations` is left out because it needs `declaration` output; a published library should add it.

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

### Moving from `@anstapol/biome-config`

Replace the dependency with `@anstapol/code-rules` and change `extends` from `@anstapol/biome-config/base` to `@anstapol/code-rules/typescript`. Suppression comments keep working: grit rules are still reported as `lint/plugin`.

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

Biome 2.5.15 ignores `extends` inside a config that is itself extended, so `next-monorepo.json` cannot extend `typescript.json`. The sources live in `src/`, and `pnpm build` writes each entry point out flat at the repo root: `src/typescript.json` merged with the type file, plus `base.json` as a copy of `typescript.json`. The merge follows Biome's own: `overrides` and `plugins` add up, a rule set in the type file replaces the shared rule, other objects merge.

Never edit the root `typescript.json`, `base.json`, `next-monorepo.json` or `expo-app.json` by hand. `pnpm test` fails when they are stale.

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

- every built entry point parses and loads in Biome, and `base.json` equals `typescript.json`;
- `typescript.json` lists every stable rule, and every rule it turns off has a row in this README;
- an ordinary React component (`className`, a text child, a hook) passes `biome check` under `typescript` and `next-monorepo`, and `biome check --write --unsafe` leaves it unchanged;
- each fail fixture reports its rule and each pass fixture lints clean under every entry point that ships the rule.

It needs `git` and `pnpm` on the path.

## Release a tag

1. Run `pnpm build` and `pnpm test`.
2. Bump `version` in `package.json` and commit it as `chore: release v0.2.0`.
3. Tag and push the tag:

```bash
git tag v0.2.0
git push origin main v0.2.0
```

4. In each project, update the `#v0.2.0` in the dependency and run `pnpm install`.

A change that makes existing code fail lint is a minor version while the package is below 1.0, and a major one after.
