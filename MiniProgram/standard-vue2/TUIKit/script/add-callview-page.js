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

// Register the CallView page in pages.json so uni-app can route to it.
function registerCallViewPage() {
  const file = resolve(ROOT, 'pages.json');
  const data = JSON.parse(readFileSync(file, 'utf-8'));

  const newPage = {
    path: 'TUIKit/components/CallView/CallView',
    style: {
      navigationBarTitleText: 'uni-app'
    }
  };

  if (data.pages.some(p => p.path === newPage.path)) {
    console.log('Skipped: CallView page already exists in pages.json');
    return;
  }

  data.pages.push(newPage);
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log('Done. CallView page config added to pages.json');
}

copyFromEngine();
registerCallViewPage();
console.log('All tasks finished.');
