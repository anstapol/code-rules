// Installs this package into a throwaway consumer, the way a project would,
// then checks the built entry points and lints each fixture under every entry
// point that ships its rule. A fail fixture must report the rule's message.
// A pass fixture must lint clean.
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const cases = join(import.meta.dirname, 'cases');
const PACKAGE = '@anstapol/code-rules';
const ENTRY_FILES = ['expo-app', 'next-monorepo', 'next-site', 'typescript'];
const TYPESCRIPT_RULES = [
  'define-tool-in-tools',
  'hooks-only',
  'no-functions-in-constants',
  'no-type-escapes',
  'schemas-only',
  'tools-only',
  'types-only'
];
const ENTRIES = {
  'expo-app': [...TYPESCRIPT_RULES, 'lucide-by-path', 'pressable-role'],
  'next-monorepo': [...TYPESCRIPT_RULES, 'no-private-process-env'],
  'next-site': [...TYPESCRIPT_RULES, 'no-private-process-env'],
  typescript: TYPESCRIPT_RULES
};
let passed = 0;
let failed = 0;

function report(ok, label, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`ok   ${label}`);
  } else {
    failed += 1;
    console.log(`FAIL ${label}\n${detail}`);
  }
}

function run(command, args, cwd) {
  return spawnSync(command, args, { cwd, encoding: 'utf8' });
}

function must(result, what) {
  if (result.status !== 0) {
    console.error(`${what} failed:\n${result.stdout}${result.stderr}`);
    process.exit(1);
  }
}

function messages(rule) {
  const grit = readFileSync(join(root, 'rules', `${rule}.grit`), 'utf8');
  return [...grit.matchAll(/message="((?:[^"\\]|\\.)*)"/g)].map((m) =>
    m[1].replaceAll('\\"', '"')
  );
}

function filesIn(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)));
}

function setUpConsumer() {
  const dir = mkdtempSync(join(tmpdir(), 'code-rules-consumer-'));
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({
      devDependencies: { [PACKAGE]: `file:${root}`, '@biomejs/biome': '2.6.8' },
      name: 'consumer',
      private: true
    })
  );
  must(run('git', ['init', '-q'], dir), 'git init');
  must(
    run('pnpm', ['install', '--prefer-offline', '--ignore-scripts', '--silent'], dir),
    'pnpm install'
  );
  // Declared after install so they are never fetched: Biome only reads the
  // manifest for noUndeclaredDependencies and to turn on the React domain.
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  manifest.dependencies = {
    '@acme/database': '*',
    'lucide-react-native': '*',
    next: '*',
    react: '*',
    'react-native': '*'
  };
  writeFileSync(join(dir, 'package.json'), JSON.stringify(manifest));
  writeFileSync(
    join(dir, 'tsconfig.json'),
    JSON.stringify({ compilerOptions: { paths: { '@/*': ['./*'] } } })
  );
  return dir;
}

function useEntry(consumer, entry, plugins = []) {
  writeFileSync(
    join(consumer, 'biome.json'),
    JSON.stringify({
      extends: [`${PACKAGE}/${entry}`],
      plugins: plugins.map((rule) => `./node_modules/${PACKAGE}/rules/${rule}.grit`)
    })
  );
}

function biome(consumer, args) {
  const result = run(join(consumer, 'node_modules/.bin/biome'), args, consumer);
  return { output: `${result.stdout}${result.stderr}`, status: result.status };
}

function placeFixture(consumer, fixtureDir) {
  for (const top of ['app', 'features', 'lib']) {
    rmSync(join(consumer, top), { force: true, recursive: true });
  }
  cpSync(fixtureDir, consumer, { recursive: true });
  return filesIn(fixtureDir);
}

function lintCase(consumer, fixtureDir) {
  const files = placeFixture(consumer, fixtureDir);
  const { output, status } = biome(consumer, [
    'lint',
    '--error-on-warnings',
    '--reporter=github',
    '--max-diagnostics=200',
    ...files
  ]);
  return { files, output, status };
}

// The base is the recommended preset plus named rules, and declares the Jest
// globals in tests, so a project's tests need no imports from @jest/globals.
function checkBase() {
  const config = JSON.parse(readFileSync(join(root, 'typescript.json'), 'utf8'));
  report(config.linter.rules.preset === 'recommended', 'typescript.json uses the recommended preset');
  const tests = config.overrides.find((override) => override.includes.includes('**/test/**'));
  const globals = tests?.javascript?.globals ?? [];
  report(
    ['describe', 'expect', 'it', 'jest', 'test'].every((name) => globals.includes(name)),
    'tests declare the Jest globals',
    globals.join(', ')
  );
}

// next-site is next-monorepo without the workspace parts: the same Next rules,
// no package barrels and no shared next-config.ts.
function checkNextSite() {
  const read = (name) => JSON.parse(readFileSync(join(root, `${name}.json`), 'utf8'));
  const site = read('next-site');
  const monorepo = read('next-monorepo');
  const paths = site.overrides.flatMap((override) => override.includes);
  const workspace = paths.filter((path) =>
    /packages\/|tooling\/|apps\/|next-config\.ts/.test(path)
  );
  report(workspace.length === 0, 'next-site has no workspace paths', workspace.join(', '));
  report(
    JSON.stringify(site.linter) === JSON.stringify(monorepo.linter) &&
      JSON.stringify(site.css) === JSON.stringify(monorepo.css),
    'next-site and next-monorepo share their rules'
  );
}

function checkEntryPoints(consumer) {
  for (const name of ENTRY_FILES) {
    try {
      JSON.parse(readFileSync(join(root, `${name}.json`), 'utf8'));
      report(true, `${name}.json parses`);
    } catch (error) {
      report(false, `${name}.json parses`, String(error));
    }
  }
  for (const name of ENTRY_FILES) {
    useEntry(consumer, name);
    placeFixture(consumer, join(cases, 'types-only', 'pass'));
    const { output, status } = biome(consumer, ['lint', 'features']);
    report(status === 0, `Biome loads ${PACKAGE}/${name}`, output);
  }
}

function checkReactComponent(consumer) {
  const fixture = join(cases, 'react-component');
  for (const entry of ['typescript', 'next-monorepo', 'next-site']) {
    useEntry(consumer, entry);
    const files = placeFixture(consumer, fixture);
    const check = biome(consumer, ['check', '--error-on-warnings', ...files]);
    report(check.status === 0, `${entry} react-component passes biome check`, check.output);
    biome(consumer, ['check', '--write', '--unsafe', ...files]);
    const changed = files.filter(
      (file) =>
        readFileSync(join(consumer, file), 'utf8') !== readFileSync(join(fixture, file), 'utf8')
    );
    report(
      changed.length === 0,
      `${entry} react-component unchanged by check --write --unsafe`,
      changed.join('\n')
    );
  }
}

// noVoid and noFloatingPromises are both on. An intentionally un-awaited
// promise satisfies both by handling its rejection with .catch().
function checkFireAndForget(consumer) {
  const fixture = join(cases, 'fire-and-forget');
  for (const name of ENTRY_FILES) {
    useEntry(consumer, name);
    const files = placeFixture(consumer, fixture);
    const check = biome(consumer, ['check', '--error-on-warnings', ...files]);
    report(check.status === 0, `${name} fire-and-forget passes biome check`, check.output);
  }
}

// Type parameters may take the T prefix (TData), which strictCase alone reports on Biome 2.6.
function checkTypeParameters(consumer) {
  const fixture = join(cases, 'type-parameters');
  for (const name of ENTRY_FILES) {
    useEntry(consumer, name);
    const files = placeFixture(consumer, fixture);
    const check = biome(consumer, ['check', '--error-on-warnings', ...files]);
    report(check.status === 0, `${name} type-parameters passes biome check`, check.output);
  }
}

// The features pattern: relative imports and the database client in server.ts
// pass in every project type, and a route file may define its page component.
function checkFeaturesPattern(consumer) {
  const fixture = join(cases, 'features-pattern');
  for (const name of ENTRY_FILES) {
    useEntry(consumer, name);
    const files = placeFixture(consumer, fixture).filter(
      (file) => name !== 'typescript' || !file.startsWith('app')
    );
    const check = biome(consumer, ['check', '--error-on-warnings', ...files]);
    report(check.status === 0, `${name} features-pattern passes biome check`, check.output);
  }
}

// Helpers stay pure: the database client is reported in helpers.ts.
function checkPureHelpers(consumer) {
  const message = 'Helpers stay pure. Do I/O in queries, mutations, actions or server.ts.';
  for (const name of ENTRY_FILES) {
    useEntry(consumer, name);
    for (const kind of ['fail', 'pass']) {
      const { files, output, status } = lintCase(consumer, join(cases, 'helpers-pure', kind));
      const ok = kind === 'fail' ? output.includes(message) : status === 0 && !output.includes('::');
      report(ok, `${name} helpers-pure ${kind} (${files.join(', ')})`, output);
    }
  }
}

// A Next metadata image route may re-export its sibling, as twitter-image.tsx
// does with opengraph-image.tsx. Any other re-export in app/ is still a barrel.
function checkMetadataImages(consumer) {
  for (const name of ['next-monorepo', 'next-site']) {
    useEntry(consumer, name);
    for (const kind of ['fail', 'pass']) {
      const { files, output, status } = lintCase(consumer, join(cases, 'metadata-images', kind));
      const ok =
        kind === 'fail' ? output.includes('noBarrelFile') : status === 0 && !output.includes('::');
      report(ok, `${name} metadata-images ${kind} (${files.join(', ')})`, output);
    }
  }
}

const build = run('node', [join(root, 'scripts/build.js'), '--check'], root);
must(build, 'Entry points are stale. pnpm build');

checkBase();
checkNextSite();
const consumer = setUpConsumer();
checkEntryPoints(consumer);
checkReactComponent(consumer);
checkFireAndForget(consumer);
checkTypeParameters(consumer);
checkFeaturesPattern(consumer);
checkPureHelpers(consumer);
checkMetadataImages(consumer);

function checkRule(consumer, entry, rule) {
  const expected = messages(rule);
  for (const kind of ['fail', 'pass']) {
    const { files, output, status } = lintCase(consumer, join(cases, rule, kind));
    const fired = expected.some((message) => output.includes(message));
    const ok = kind === 'fail' ? fired : status === 0 && !output.includes('::');
    report(ok, `${entry} ${rule} ${kind} (${files.join(', ')})`, output);
  }
}

for (const [entry, rules] of Object.entries(ENTRIES)) {
  useEntry(consumer, entry);
  for (const rule of rules) {
    checkRule(consumer, entry, rule);
  }
}

rmSync(consumer, { force: true, recursive: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
