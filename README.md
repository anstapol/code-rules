# @anstapol/biome-config

Shared Biome config and grit rules for my projects. It has three entry points:

- `base`: formatter, core lint rules, and the role-file rules for a `features/<domain>/` layout (`constants.ts`, `types.ts`, `schemas.ts`, `hooks.ts`, `helpers.ts`). Works on its own, for example in a TanStack Start app.
- `next-monorepo`: `base` plus rules for a Next.js and Turborepo monorepo: `process.env` access, AI tool files, Tailwind class sorting, sorted keys, Prisma and package barrels.
- `expo-app`: `base` plus rules for an Expo app: theme colours and numbers, inline styles, `Pressable` roles, route files, lucide imports, `process.env`.

It needs Biome 2.5.15 exactly. It is a peer dependency, so the project installs it.

## Install

Add it as a git dependency pinned to a tag, next to Biome:

```bash
pnpm add -D @biomejs/biome@2.5.15 "@anstapol/biome-config@github:anstapol/code-rules#v0.1.0"
```

Then extend one entry point in the project's root `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.15/schema.json",
  "extends": ["@anstapol/biome-config/next-monorepo"],
  "files": {
    "includes": ["**", "!**/*.gen.ts"]
  }
}
```

The package does not set `files`, so each project lists what Biome should read.

### Where `biome.json` must live

The grit rules are referenced as `./node_modules/@anstapol/biome-config/rules/<rule>.grit`. Biome 2.5.15 resolves plugin paths in an extended config from the project's root config, not from the config that declares them. So the root `biome.json` must sit next to a `node_modules` folder that contains this package. In a pnpm workspace, add it to the root `package.json`.

## Local overrides

Anything in the project's `biome.json` is applied after the entry point.

- `overrides` and `plugins` add to the shared ones.
- Setting a rule replaces the shared setting with all its options. To add one path to `noRestrictedImports`, copy the shared `paths` and `patterns` too, or the shared ones are lost.
- A shared grit rule cannot be switched off for a path in config. Suppress it in the file instead, with a reason:

```ts
// biome-ignore-all lint/plugin/no-private-process-env: this script runs in Node at build time
```

## How the entry points are built

Biome 2.5.15 ignores `extends` inside a config that is itself extended, so `next-monorepo.json` cannot extend `base.json`. The sources live in `src/`, and `pnpm build` writes each entry point out flat at the repo root: `src/base.json` merged with the type file. The merge follows Biome's own: `overrides` and `plugins` add up, a rule set in the type file replaces the base rule, other objects merge.

Never edit the root `base.json`, `next-monorepo.json` or `expo-app.json` by hand. `pnpm test` fails when they are stale.

## Add or change a rule

1. Write the grit rule in `rules/<name>.grit`. Each `register_diagnostic` message says what to do instead.
2. Turn it on in `src/base.json` if every project type wants it, otherwise in `src/next-monorepo.json` or `src/expo-app.json`. Reference it as `./node_modules/@anstapol/biome-config/rules/<name>.grit`, usually inside an override with `includes`.
3. Add two fixtures, laid out as files in a consumer project:
   - `test/cases/<name>/fail/...` must report the rule's message.
   - `test/cases/<name>/pass/...` must lint clean under every entry point that ships the rule.
4. Add the rule name to the entry points it belongs to in `test/run.js`.
5. Run `pnpm build` and `pnpm test`.

For a core Biome rule, edit the `src/` file and run `pnpm build`. Add a fixture only if the rule is easy to get wrong.

## Test

```bash
pnpm install
pnpm test
```

The test installs this package from its local path into a temporary project, extends each entry point in turn, and runs `biome lint` on each fixture. Nothing calls the grit files directly. It needs `git` and `pnpm` on the path.

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
