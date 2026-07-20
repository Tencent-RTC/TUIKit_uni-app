/**
 * Script: add-callview-page-subpackage.js
 *
 * Subpackage version of add-callview-page.js.
 * Follows the IM uni-app standard edition subpackage integration guide:
 *   https://cloud.tencent.com/document/product/269/124305
 *
 * Differences from the non-subpackage variant:
 *   1. TUIKit pages are registered under pages.json `subPackages` instead of `pages`.
 *   2. The TUIKit directory becomes a subpackage root, keeping the main package small.
 *   3. The script also sets `optimization.subPackages: true` in manifest.json.
 */

const {
  readFileSync,
  writeFileSync,
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  statSync,
} = require('fs');
const { resolve, dirname } = require('path');

const ROOT = resolve(__dirname, '..', '..');
const SRC = resolve(ROOT, 'node_modules/@trtc/calls-uikit-wx-uniapp/TUICallKit');
const DEST = resolve(ROOT, 'TUIKit');

// Source items to copy. Each entry: { src, dest, strategy? }
// - strategy 'overwrite' (default): plain copy/recursive copy.
// - strategy 'merge-index': merge the engine's `index.ts` with the
//   existing destination file, preserving the demo's chat/login
//   exports alongside the engine's call surface.
const COPY_ITEMS = [
  { src: 'index.ts', dest: 'index.ts', strategy: 'merge-index' },
  { src: 'assets/call', dest: 'assets/call' },
  { src: 'call/index.ts', dest: 'call/index.ts' },
  { src: 'components/CallView', dest: 'components/CallView' },
  { src: 'components/GroupCallView', dest: 'components/GroupCallView' },
  { src: 'components/index.ts', dest: 'components/index.ts' },
  { src: 'states/TUICallService', dest: 'states/TUICallService' },
  { src: 'states/CallListState.ts', dest: 'states/CallListState.ts' },
  { src: 'states/CallParticipantState.ts', dest: 'states/CallParticipantState.ts' },
  { src: 'states/DeviceState.ts', dest: 'states/DeviceState.ts' },
  { src: 'states/UIConfigState.ts', dest: 'states/UIConfigState.ts' },
  { src: 'adapter/vue-version.ts', dest: 'adapter/vue-version.ts' },
  { src: 'adapter/vue-demi.ts', dest: 'adapter/vue-demi.ts' },
  { src: 'plugin/ring', dest: 'plugin/ring' },
  { src: 'utils/permission.ts', dest: 'utils/permission.ts' },
];

// --- Merge strategy for `index.ts` ---------------------------------------

// Parse the top-level import / export statements from a TS module body.
// Block comments are stripped before parsing to avoid picking up code
// samples inside JSDoc. The parser is intentionally simple and only
// supports the constructs actually used by the engine's `index.ts`
// and the demo's `index.ts`:
//   - `import { a, b } from 'x';`
//   - `export * from 'x';`
//   - `export { a, b as c } from 'x';`
//   - `export { a, b };`
function parseTsModule(src) {
  const imports = new Set();           // full normalized import statements
  const starExports = [];              // ['./chat', './call']
  const namedFromExports = new Map();  // source -> Set<name>
  const bareExports = new Set();       // names with no `from` clause

  // Strip /* ... */ block comments to avoid JSDoc noise.
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, '');
  const lines = stripped.split('\n');
  let i = 0;

  const readUntilSemicolon = (startLine) => {
    let stmt = startLine.trim();
    while (!stmt.includes(';') && i + 1 < lines.length) {
      i++;
      stmt += ' ' + lines[i].trim();
    }
    return stmt.replace(/;+\s*$/, ';');
  };

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line.startsWith('import ')) {
      const stmt = readUntilSemicolon(line);
      imports.add(stmt);
      i++;
      continue;
    }

    if (line.startsWith('export *')) {
      const m = line.match(/from\s*['"]([^'"]+)['"]/);
      if (m) starExports.push(m[1]);
      i++;
      continue;
    }

    if (line.startsWith('export {')) {
      // Collect the full `export { ... }` block, which may span lines.
      let block = '';
      let depth = 0;
      let opened = false;
      while (i < lines.length) {
        block += lines[i] + '\n';
        for (const ch of lines[i]) {
          if (ch === '{') { depth++; opened = true; }
          else if (ch === '}') depth--;
        }
        if (opened && depth === 0) break;
        i++;
      }
      i++;

      const fromMatch = block.match(/from\s*['"]([^'"]+)['"]/);
      // Extract the names list between the outermost braces.
      const inner = block
        .replace(/^[^=]*?\{/, '')
        .replace(/\}[^]*/, '')
        .replace(/from\s*['"][^'"]+['"]\s*;?/, '')
        .trim();
      const names = inner
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      if (fromMatch) {
        const set = namedFromExports.get(fromMatch[1]) || new Set();
        names.forEach(n => set.add(n));
        namedFromExports.set(fromMatch[1], set);
      } else {
        names.forEach(n => bareExports.add(n));
      }
      continue;
    }

    i++;
  }

  return { imports, starExports, namedFromExports, bareExports };
}

// Produce a merged `index.ts` body that keeps the demo's chat/login
// surface and the engine's call surface side by side. Existing
// statements come first so demo identity is preserved; engine
// statements that don't already exist are appended.
function buildMergedIndexTs(engineContent, existingContent) {
  const engine = parseTsModule(engineContent);
  const existing = parseTsModule(existingContent);

  // 1. Imports: union, existing first.
  const imports = [...existing.imports, ...engine.imports];

  // 2. `export * from 'x'` lines: dedupe, existing first.
  const seenStar = new Set();
  const starExports = [];
  for (const s of [...existing.starExports, ...engine.starExports]) {
    if (!seenStar.has(s)) {
      seenStar.add(s);
      starExports.push(s);
    }
  }

  // 3. `export { ... } from 'x'`: merge per source, existing first.
  const namedFromExports = new Map();
  const mergeMap = (target, src) => {
    for (const [source, names] of src) {
      const set = target.get(source) || new Set();
      names.forEach(n => set.add(n));
      target.set(source, set);
    }
  };
  mergeMap(namedFromExports, existing.namedFromExports);
  mergeMap(namedFromExports, engine.namedFromExports);

  // 4. Bare `export { a, b };`: combine and dedupe — skip names already
  //    re-exported via `export { ... } from '...'` to avoid duplicate name error.
  const alreadyNamed = new Set();
  for (const names of namedFromExports.values()) {
    names.forEach(n => alreadyNamed.add(n));
  }
  const bareExports = new Set();
  for (const name of [...existing.bareExports, ...engine.bareExports]) {
    if (!alreadyNamed.has(name)) bareExports.add(name);
  }

  // 5. Render.
  const out = [];
  for (const stmt of imports) out.push(stmt);
  out.push('');
  for (const s of starExports) out.push(`export * from '${s}';`);

  if (namedFromExports.size > 0) {
    out.push('');
    for (const [source, names] of namedFromExports) {
      out.push(`export { ${[...names].join(', ')} } from '${source}';`);
    }
  }

  if (bareExports.size > 0) {
    out.push('');
    out.push('export {');
    out.push(`    ${[...bareExports].join(',\n    ')},`);
    out.push('};');
  }

  return out.join('\n') + '\n';
}

// --- Copy logic ---------------------------------------------------------

function copyOne({ src, dest, strategy }) {
  const srcPath = resolve(SRC, src);
  const destPath = resolve(DEST, dest);

  if (!existsSync(srcPath)) {
    console.warn(`Skip (not found): ${srcPath}`);
    return;
  }

  mkdirSync(dirname(destPath), { recursive: true });

  if (strategy === 'merge-index') {
    const engineContent = readFileSync(srcPath, 'utf-8');
    const existingContent = existsSync(destPath)
      ? readFileSync(destPath, 'utf-8')
      : '';
    const merged = buildMergedIndexTs(engineContent, existingContent);
    writeFileSync(destPath, merged, 'utf-8');
    console.log(`Merged: ${dest}`);
    return;
  }

  const stat = statSync(srcPath);
  if (stat.isDirectory()) {
    cpSync(srcPath, destPath, { recursive: true, force: true });
  } else {
    copyFileSync(srcPath, destPath);
  }
  console.log(`Copied: ${dest}`);
}

function copyFromEngine() {
  if (!existsSync(SRC)) {
    console.error(`Source directory not found: ${SRC}`);
    process.exit(1);
  }
  for (const item of COPY_ITEMS) copyOne(item);
}

// --- Subpackage pages.json configuration ---------------------------------

// List of TUIKit pages that should be registered under subPackages.
// These paths are relative to the TUIKit subpackage root.
const SUBPACKAGE_PAGES = [
  {
    path: 'components/CallView/CallView',
    style: {
      navigationBarTitleText: 'uni-app',
    },
  },
  {
    path: 'components/Group/GroupSettings',
    style: {
      navigationBarTitleText: '群设置',
    },
  },
];

// Set `optimization.subPackages: true` in manifest.json for mp-weixin.
function enableSubpackageOptimization() {
  const file = resolve(ROOT, 'manifest.json');
  if (!existsSync(file)) {
    console.warn('Skip: manifest.json not found.');
    return;
  }

  let raw = readFileSync(file, 'utf-8');
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch {
    console.error('Error: manifest.json is not valid JSON.');
    return;
  }

  if (!manifest['mp-weixin']) {
    manifest['mp-weixin'] = {};
  }
  if (!manifest['mp-weixin'].optimization) {
    manifest['mp-weixin'].optimization = {};
  }
  if (manifest['mp-weixin'].optimization.subPackages === true) {
    console.log('Skipped: optimization.subPackages is already enabled in manifest.json');
    return;
  }

  manifest['mp-weixin'].optimization.subPackages = true;
  writeFileSync(file, JSON.stringify(manifest, null, '  ') + '\n', 'utf-8');
  console.log('Done: optimization.subPackages set to true in manifest.json');
}

// Move TUIKit-related page registrations from `pages` to `subPackages`.
// The main `pages` array keeps only non-TUIKit pages (login, conversation, profile, chat, etc.).
// TUIKit pages (CallView, GroupSettings) are moved to `subPackages[0].pages`.
function registerSubpackagePages() {
  const file = resolve(ROOT, 'pages.json');
  const data = JSON.parse(readFileSync(file, 'utf-8'));

  // Paths that belong to the TUIKit subpackage.
  const tuiKitPaths = new Set(SUBPACKAGE_PAGES.map(p => p.path));

  // Separate main pages from TUIKit pages.
  const mainPages = data.pages.filter(p => !tuiKitPaths.has(p.path));
  const tuiKitPages = data.pages.filter(p => tuiKitPaths.has(p.path));

  // Ensure subPackages array exists.
  if (!data.subPackages) {
    data.subPackages = [];
  }

  // Find or create the TUIKit subpackage entry.
  let tuiSub = data.subPackages.find(s => s.root === 'TUIKit');
  if (!tuiSub) {
    tuiSub = { root: 'TUIKit', pages: [] };
    data.subPackages.push(tuiSub);
  }

  // Merge any new pages from SUBPACKAGE_PAGES that aren't already registered.
  const existingPaths = new Set(tuiSub.pages.map(p => p.path));
  for (const pageDef of SUBPACKAGE_PAGES) {
    if (!existingPaths.has(pageDef.path)) {
      tuiSub.pages.push(pageDef);
      console.log(`Added subpackage page: TUIKit/${pageDef.path}`);
    }
  }

  // Also carry over any existing TUIKit pages from data.pages that match.
  for (const p of tuiKitPages) {
    if (!existingPaths.has(p.path)) {
      tuiSub.pages.push(p);
      console.log(`Moved existing page to subpackage: TUIKit/${p.path}`);
    }
  }

  // Replace pages with only the non-TUIKit pages.
  data.pages = mainPages;

  writeFileSync(file, JSON.stringify(data, null, '  ') + '\n', 'utf-8');
  console.log('Done: TUIKit pages moved to subPackages in pages.json');
}

// --- Main ----------------------------------------------------------------

copyFromEngine();
enableSubpackageOptimization();
registerSubpackagePages();
console.log('All tasks finished (subpackage mode).');
