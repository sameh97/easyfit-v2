// Fails when en.json and he.json don't have exactly the same keys (redesign.md §7.10, Phase 2).
// Usage: node scripts/check-i18n-keys.js
const fs = require('fs');
const path = require('path');

const I18N_DIR = path.join(__dirname, '..', 'src', 'assets', 'i18n');
const FILES = ['en.json', 'he.json'];

/** @param {unknown} node @param {string} prefix @param {string[]} out */
function leafKeys(node, prefix, out) {
  if (node !== null && typeof node === 'object' && !Array.isArray(node)) {
    for (const [key, value] of Object.entries(node)) {
      leafKeys(value, prefix ? `${prefix}.${key}` : key, out);
    }
  } else {
    if (typeof node !== 'string' || node.trim() === '') {
      out.push(`${prefix} = <${JSON.stringify(node)} is not a non-empty string>`);
    }
    out.push(prefix);
  }
  return out;
}

const keySets = FILES.map((file) => {
  const json = JSON.parse(fs.readFileSync(path.join(I18N_DIR, file), 'utf8'));
  return { file, keys: new Set(leafKeys(json, '', [])) };
});

let problems = 0;
for (const a of keySets) {
  for (const b of keySets) {
    if (a === b) continue;
    for (const key of a.keys) {
      if (!b.keys.has(key)) {
        console.error(`${b.file} is missing: ${key}`);
        problems++;
      }
    }
  }
}

if (problems) {
  console.error(`\n✖ ${problems} key problem(s) between ${FILES.join(' and ')}`);
  process.exit(1);
}
console.log(`✔ ${FILES.join(' and ')} have the same ${keySets[0].keys.size} keys`);
