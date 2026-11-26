// Biome 2.5.15 ignores `extends` inside a config that is itself extended, so
// each entry point is written out flat: src/base.json merged with the type file.
// Run with --check to fail when the committed entry points are stale.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const read = (name) => JSON.parse(readFileSync(join(root, 'src', `${name}.json`), 'utf8'));

// Mirrors how Biome merges `extends`: overrides and plugins add up, a rule set
// later replaces the earlier rule with its options, other objects merge.
const CONCAT = new Set(['overrides', 'plugins']);
const isRulePath = (path) => path.length === 4 && path[0] === 'linter' && path[1] === 'rules';

function merge(base, extra, path = []) {
  const out = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const here = [...path, key];
    const prev = out[key];
    if (CONCAT.has(key) && Array.isArray(prev)) {
      out[key] = [...prev, ...value];
    } else if (isPlainObject(prev) && isPlainObject(value) && !isRulePath(here)) {
      out[key] = merge(prev, value, here);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const base = read('base');
const entries = {
  base,
  'expo-app': merge(base, read('expo-app')),
  'next-monorepo': merge(base, read('next-monorepo'))
};

const check = process.argv.includes('--check');
let stale = 0;
for (const [name, config] of Object.entries(entries)) {
  const file = join(root, `${name}.json`);
  const text = `${JSON.stringify(config, null, 2)}\n`;
  if (!check) {
    writeFileSync(file, text);
    continue;
  }
  let current = '';
  try {
    current = readFileSync(file, 'utf8');
  } catch {}
  if (current !== text) {
    console.error(`${name}.json is stale. Run pnpm build.`);
    stale += 1;
  }
}
process.exitCode = stale ? 1 : 0;
