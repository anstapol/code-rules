# Changelog

## v0.3.0

### Entry points

- New `next-site` entry point for a single Next.js app at the repo root, with `app/` and `features/` and no workspace packages. It has every Next.js and React rule of `next-monorepo`: `no-private-process-env`, Next imports banned in helpers, default exports in `app/`, email templates and MDX files, `noConsole` off in `prisma/`, Tailwind class sorting and the Tailwind CSS parser. It leaves out the workspace package barrels (`packages/*`, `tooling/*`) and the shared `next-config.ts`, which `no-private-process-env` also no longer skips there.
- The features pattern is the same as in every other entry point.
- The shared Next.js rules live in `src/next.json`. `next-monorepo` and `next-site` both build from it. `next-monorepo.json` has the same rules as in v0.2.0, with its overrides in a different order.

No rule changed in an existing entry point, so code that passed v0.2.0 still passes.

## v0.2.0

The config now matches one reference Next.js monorepo, which passes it with zero diagnostics, plus the features pattern in the shared base. Maximum strictness is replaced by a policy of tightening one rule or compiler flag per tag.

### Rules

- The base uses Biome's `recommended` preset plus a named list of rules, instead of every stable rule at `error`. Every other rule is no longer on, including `noImplicitBoolean`, `useExportsLast`, `noAwaitInLoops`, `noVoid`, `useNumericSeparators`, `noUndeclaredVariables`, `noEnum`, `noContinue` and `noExcessiveLinesPerFile`.
- Options follow the reference project: cognitive complexity 15 (was 10), `noConsole` allows `console.error` and `console.warn`, and the other rules use Biome's default options.
- `noProcessEnv`, `noProcessGlobal`, `noNodejsModules` and `noUndeclaredEnvVars` are off. `next-monorepo` keeps `no-private-process-env`.
- Assist sorts imports, keys and JSX attributes. It no longer sorts interface members or CSS properties, or removes duplicate classes.
- No `lodash`, `underscore`, `dayjs` or `moment` ban. The only global import ban is `memo`, `useCallback` and `useMemo`.
- `useAwait` is no longer relaxed in server actions.
- The ban on `../` imports and the rule that only `db/`, `database/` and repositories may import the database client are removed from every entry point.

### Features pattern

- The same features pattern applies in every entry point and lives in `typescript`.
- Role rules match by path inside a feature: `**/features/**/<file>` and `**/src/*/<file>`. `types/**` is no longer a role folder. `constants.ts` still counts anywhere.
- `useComponentExportOnlyModules` applies only to `**/features/*/components/**` and `**/src/*/components/**`.
- Helpers and `tools.ts` may not import the database client: `@prisma/client`, `drizzle-orm`, `expo-sqlite` or `@*/database/client`.

### Entry points

- `next-monorepo` also allows barrel files in workspace package entry points, default exports in email templates and MDX files, `noConsole` in `prisma/`, and treats `next-config.ts` like a config file. `no-private-process-env` skips config files, `next-config.ts`, `prisma/`, scripts and tests.
- `expo-app` keeps only Expo and React Native rules: `noReactNativeRawText`, Expo Router file names and default exports, no `react-native` in helpers, `pressable-role` and `lucide-by-path`.
- Tests declare the Jest globals.
- `docs/features-pattern.md` documents every role, the paths each rule matches and what each file may contain. It ships in the package.

### Removed grit rules

`routes-only`, `no-raw-colors`, `no-raw-numbers`, `no-raw-primitives`, `danger-in-kit`, `no-inline-styles` and `one-primary-action` are no longer in the package. A project that wants one keeps its own copy.

### Formatter

- Line width is 100 columns, up from 80.
- `formatter.expand`, `arrowParentheses`, `bracketSameLine`, `quoteProperties`, `operatorLinebreak`, `formatWithErrors`, `useEditorconfig` and the CSS formatter settings are no longer set, so Biome's defaults apply.

### TypeScript

`tsconfig/strict.json` keeps `strict`, `isolatedModules` and `moduleDetection: force`. These flags are removed: `allowUnreachableCode: false`, `allowUnusedLabels: false`, `checkJs`, `erasableSyntaxOnly`, `exactOptionalPropertyTypes`, `forceConsistentCasingInFileNames`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`, `noUncheckedIndexedAccess`, `noUncheckedSideEffectImports`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`.

### Can report code that passed v0.1.0

- Lines up to 100 columns are joined by the formatter. Run `biome check --write`.
- `useLiteralKeys` is on again through `recommended`. Its fix is unsafe: `biome check --write --unsafe`.
- `useAwait` reports a server action with nothing to await.
- A `tools.ts` that imports the database client is reported, and so is a helper that imports `drizzle-orm`, `expo-sqlite` or `@prisma/client`.

## v0.1.0

First release: `typescript`, `next-monorepo` and `expo-app` Biome entry points with every stable rule at `error`, grit rules and `tsconfig/strict.json`.
