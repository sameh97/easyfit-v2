// Fails when Studio templates use physical-direction utilities (redesign.md §7.10, Phase 2 step 1).
// Studio folders = the Tailwind `purge` list, so a newly redesigned folder is checked as soon as it's added.
// Usage: node scripts/check-logical-utils.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const config = require(path.join(ROOT, 'tailwind.config.js'));

// ml-4, -mr-2, md:pl-3, left-0, right-[4px], text-left, border-l, border-r-2, rounded-l-lg, rounded-tr…
// The look-behind skips icon names such as "chevron-left" or "panel-left".
const BANNED =
  /(?<![\w-])(?:[\w-]+:)*-?(?:(?:ml|mr|pl|pr|left|right)-[\w.\/\[\]%-]+|text-(?:left|right)|border-[lr](?:-\d+)?|rounded-(?:[lr]|tl|tr|bl|br)(?:-[\w\[\]]+)?)(?![\w-])/g;

/** "./src/app/foo/**\/*.{html,ts}" → "src/app/foo" */
const folders = config.purge.map((glob) => glob.replace(/^\.\//, '').split('/**')[0]);

/** @param {string} dir @returns {string[]} */
function files(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) return files(rel);
    return /\.(html|ts)$/.test(entry.name) && !entry.name.endsWith('.spec.ts') ? [rel] : [];
  });
}

let problems = 0;
for (const file of folders.flatMap(files)) {
  const lines = fs.readFileSync(path.join(ROOT, file), 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const match of line.matchAll(BANNED)) {
      console.error(`${file}:${index + 1}  ${match[0]}`);
      problems++;
    }
  });
}

if (problems) {
  console.error(`\n✖ ${problems} physical-direction utilit${problems === 1 ? 'y' : 'ies'}; use ms-/me-/ps-/pe-/start-/end-/text-start/border-s/rounded-s instead`);
  process.exit(1);
}
console.log(`✔ No physical-direction utilities in ${folders.length} Studio folders`);
