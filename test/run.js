// Installs this package into a throwaway consumer, the way a project would,
// then lints each fixture under every entry point that ships its rule.
// A fail fixture must report the rule's message. A pass fixture must lint clean.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const cases = join(import.meta.dirname, 'cases');

const BASE_RULES = [
  'hooks-only',
  'no-functions-in-constants',
  'no-type-escapes',
  'schemas-only',
  'types-only'
];
const ENTRIES = {
  base: BASE_RULES,
  'expo-app': [
    ...BASE_RULES,
    'lucide-by-path',
    'no-inline-styles',
    'no-raw-colors',
    'no-raw-numbers',
    'pressable-role',
    'routes-only'
  ],
  'next-monorepo': [
    ...BASE_RULES,
    'define-tool-in-tools',
    'no-private-process-env',
    'tools-only'
  ]
};

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
  return [...grit.matchAll(/message="((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replaceAll('\\"', '"'));
}

function filesIn(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, join(entry.parentPath, entry.name)));
}

function setUpConsumer() {
  const dir = mkdtempSync(join(tmpdir(), 'biome-config-consumer-'));
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({
      devDependencies: { '@anstapol/biome-config': `file:${root}`, '@biomejs/biome': '2.5.15' },
      name: 'consumer',
      private: true
    })
  );
  must(run('git', ['init', '-q'], dir), 'git init');
  must(run('pnpm', ['install', '--prefer-offline', '--ignore-scripts', '--silent'], dir), 'pnpm install');
  // Declared after install so they are never fetched: Biome only reads the manifest
  // for noUndeclaredDependencies and to turn on the React domain.
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

function lintCase(consumer, fixtureDir) {
  for (const top of ['app', 'features', 'lib']) {
    rmSync(join(consumer, top), { force: true, recursive: true });
  }
  cpSync(fixtureDir, consumer, { recursive: true });
  const files = filesIn(fixtureDir);
  const result = run(
    join(consumer, 'node_modules/.bin/biome'),
    ['lint', '--reporter=github', '--max-diagnostics=200', ...files],
    consumer
  );
  return { files, output: `${result.stdout}${result.stderr}`, status: result.status };
}

const build = run('node', [join(root, 'scripts/build.js'), '--check'], root);
must(build, 'Entry points are stale. pnpm build');

const consumer = setUpConsumer();
let passed = 0;
let failed = 0;

for (const [entry, rules] of Object.entries(ENTRIES)) {
  writeFileSync(
    join(consumer, 'biome.json'),
    JSON.stringify({ extends: [`@anstapol/biome-config/${entry}`] })
  );
  for (const rule of rules) {
    const expected = messages(rule);
    for (const kind of ['fail', 'pass']) {
      const { files, output, status } = lintCase(consumer, join(cases, rule, kind));
      const fired = expected.some((message) => output.includes(message));
      const ok = kind === 'fail' ? fired : status === 0 && !output.includes('::');
      const label = `${entry} ${rule} ${kind} (${files.join(', ')})`;
      if (ok) {
        passed += 1;
        console.log(`ok   ${label}`);
      } else {
        failed += 1;
        console.log(`FAIL ${label}\n${output}`);
      }
    }
  }
}

rmSync(consumer, { force: true, recursive: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
