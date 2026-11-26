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
const ENTRY_FILES = ['expo-app', 'next-monorepo', 'typescript'];
const STABLE_GROUPS = [
  'a11y',
  'complexity',
  'correctness',
  'performance',
  'security',
  'style',
  'suspicious'
];

const TYPESCRIPT_RULES = [
  'define-tool-in-tools',
  'hooks-only',
  'no-functions-in-constants',
  'no-inline-styles',
  'no-type-escapes',
  'one-primary-action',
  'schemas-only',
  'tools-only',
  'types-only'
];
const ENTRIES = {
  'expo-app': [
    ...TYPESCRIPT_RULES,
    'danger-in-kit',
    'lucide-by-path',
    'no-raw-colors',
    'no-raw-numbers',
    'no-raw-primitives',
    'pressable-role',
    'routes-only'
  ],
  'next-monorepo': [...TYPESCRIPT_RULES, 'no-private-process-env', 'routes-only'],
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
      devDependencies: { [PACKAGE]: `file:${root}`, '@biomejs/biome': '2.5.15' },
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

function useEntry(consumer, entry) {
  writeFileSync(
    join(consumer, 'biome.json'),
    JSON.stringify({ extends: [`${PACKAGE}/${entry}`] })
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

// Every stable rule is listed in typescript.json, so a Biome upgrade that adds
// one fails here until it is turned on or given a written reason in the README.
function checkRuleCoverage() {
  const schema = JSON.parse(
    readFileSync(join(root, 'node_modules/@biomejs/biome/configuration_schema.json'), 'utf8')
  );
  const defs = schema.$defs;
  const deref = (ref) => defs[ref.split('/').pop()];
  const config = JSON.parse(readFileSync(join(root, 'typescript.json'), 'utf8'));
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  const missing = [];
  const undocumented = [];
  for (const group of STABLE_GROUPS) {
    const groupRef = deref(defs.Rules.properties[group].anyOf[0].$ref).anyOf[1].$ref;
    const names = Object.keys(deref(groupRef).properties).filter(
      (name) => name !== 'recommended' && name !== 'preset'
    );
    for (const name of names) {
      const setting = config.linter.rules[group]?.[name];
      if (setting === undefined) {
        missing.push(`${group}/${name}`);
      } else if (setting === 'off' && !readme.includes(`\`${name}\``)) {
        undocumented.push(`${group}/${name}`);
      }
    }
  }
  report(missing.length === 0, 'typescript.json lists every stable rule', missing.join('\n'));
  report(
    undocumented.length === 0,
    'every rule turned off in typescript.json has a README row',
    undocumented.join('\n')
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
  for (const entry of ['typescript', 'next-monorepo']) {
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

const build = run('node', [join(root, 'scripts/build.js'), '--check'], root);
must(build, 'Entry points are stale. pnpm build');

checkRuleCoverage();
const consumer = setUpConsumer();
checkEntryPoints(consumer);
checkReactComponent(consumer);

for (const [entry, rules] of Object.entries(ENTRIES)) {
  useEntry(consumer, entry);
  for (const rule of rules) {
    const expected = messages(rule);
    for (const kind of ['fail', 'pass']) {
      const { files, output, status } = lintCase(consumer, join(cases, rule, kind));
      const fired = expected.some((message) => output.includes(message));
      const ok = kind === 'fail' ? fired : status === 0 && !output.includes('::');
      report(ok, `${entry} ${rule} ${kind} (${files.join(', ')})`, output);
    }
  }
}

rmSync(consumer, { force: true, recursive: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
