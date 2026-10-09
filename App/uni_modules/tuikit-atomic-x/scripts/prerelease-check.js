#!/usr/bin/env node

/**
 * 发布前规范检查
 *
 * 使用方式：
 *   node scripts/prerelease-check.js          仅检查，不改文件
 *   node scripts/prerelease-check.js --fix     一键修复后复检
 *
 * 全部通过 exit 0，存在不合规项 exit 1（可直接挂 CI / pre-publish）。
 *
 * 检查项：
 *   1. app-android 无 libs/ 目录（依赖必须走 config.json 的 maven 坐标，不能塞本地 aar）
 *   2. app-ios/config.json 无 repo 个人源依赖（必须用已发布 pod 版本号）
 *   3. app-android 无 LogFileProvider 实现（Android 端日志导出保持空实现）
 *
 * 其中 1、2 属于依赖声明，只做标记、不自动改：换成哪个版本区间是发布决策，
 * 由人按当次发布情况决定。--fix 只处理第 3 项这类纯机械清理。
 */

const fs = require('fs');
const path = require('path');

/** tuikit-atomic-x 目录 */
const ROOT_DIR = path.resolve(__dirname, '..');
/** 示例工程根目录（uni_modules 的上两级） */
const PROJECT_DIR = path.resolve(ROOT_DIR, '../..');

const ANDROID_DIR = path.join(ROOT_DIR, 'utssdk/app-android');
const IOS_CONFIG = path.join(ROOT_DIR, 'utssdk/app-ios/config.json');

const shouldFix = process.argv.includes('--fix');

/** 收集到的不合规项；fix 为可选的修复动作 */
let failures = [];

/**
 * @param {string} check 检查项名称
 * @param {string} message 不合规描述
 * @param {(() => void) | null} fix 修复动作，null 表示无法自动修复
 */
function fail(check, message, fix = null) {
  failures.push({ check, message, fix });
}

/** 相对 PROJECT_DIR 的短路径，输出用 */
function rel(absPath) {
  return path.relative(PROJECT_DIR, absPath);
}

/** 递归列出目录下所有文件的相对路径（用于报错信息里列出 libs/ 的内容） */
function listFiles(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFiles(full, base, out);
    } else {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/** 删除文件；顺带清掉因此变空的父目录（不越过 stopDir） */
function removeFileAndEmptyParents(filePath, stopDir) {
  fs.rmSync(filePath, { force: true });
  let dir = path.dirname(filePath);
  while (dir !== stopDir && dir.startsWith(stopDir) && fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
    dir = path.dirname(dir);
  }
}

// ==================== 1. app-android 不应有 libs/ ====================

/**
 * 本地 aar 与 maven 坐标是同一件事的两种形态。只标记不自动改：
 * 删 aar 的同时必须在 config.json 补上对应坐标，且补哪个版本区间要人来定，
 * 漏了或填错会让依赖直接缺失——这种代价不该由脚本替人担。
 */
function checkAndroidLibs() {
  const libsDir = path.join(ANDROID_DIR, 'libs');
  if (!fs.existsSync(libsDir)) return;

  const files = listFiles(libsDir);
  fail(
    'app-android/libs',
    `存在本地依赖目录 ${rel(libsDir)}（${files.join(', ') || '空目录'}）；` +
      '请删除该目录，并在 utssdk/app-android/config.json 的 dependencies 补上对应 maven 坐标' +
      '（写法参照同文件内已有的 io.trtc.uikit:* 坐标）',
  );
}

// ==================== 2. app-ios 不应有个人源依赖 ====================

function checkIosPersonalRepo() {
  if (!fs.existsSync(IOS_CONFIG)) {
    fail('app-ios/config.json', `文件不存在: ${rel(IOS_CONFIG)}`);
    return;
  }

  let config;
  try {
    config = readJson(IOS_CONFIG);
  } catch (e) {
    fail('app-ios/config.json', `JSON 解析失败: ${e.message}`);
    return;
  }

  // 同样只标记：换成哪个 pod 版本（甚至 pod 名是否带 subspec）是发布决策
  const pods = config['dependencies-pods'] || [];
  for (const pod of pods) {
    if (!pod || !pod.repo) continue;
    const git = pod.repo.git || '(未填 git)';
    const tag = pod.repo.tag || pod.repo.branch || pod.repo.commit || '(未填版本)';
    fail(
      'app-ios/config.json',
      `pod "${pod.name}" 使用 repo 个人源依赖 ${git}@${tag}；` +
        '请改为已发布版本号（"version": "~> x.y.z"），并确认 pod 名是否需带 subspec',
    );
  }
}

// ==================== 3. app-android 不应有 LogFileProvider ====================

/**
 * LogFileProvider 独有的文件：存在即应删除
 * AndroidManifest.xml 仅为 LogFileProvider 声明 FileProvider，已发布版本无此文件
 */
const LOG_FILE_PROVIDER_FILES = [
  'kotlin/LogFileProvider.kt',
  'res/xml/atomicx_file_paths.xml',
  'AndroidManifest.xml',
];

/**
 * 已发布版的写法：保留 fetchLogFileList / shareLog 导出，但为空实现。
 * 导出不能删——interface 与 iOS 端都有同名声明，删了会编译报错。
 */
const LOG_STUB_BLOCK = `// ================= LogUpload: 日志导出 ====================
// Android 暂不支持，防止编译报错的空实现

export function fetchLogFileList(): string {
  return "[]"
}

export function shareLog(row: number) {
}
`;

function checkNoLogFileProvider() {
  for (const relPath of LOG_FILE_PROVIDER_FILES) {
    const full = path.join(ANDROID_DIR, relPath);
    if (!fs.existsSync(full)) continue;
    fail('LogFileProvider', `应删除文件: ${rel(full)}`, () => {
      removeFileAndEmptyParents(full, ANDROID_DIR);
      console.log(`  ✓ 已删除 ${rel(full)}`);
    });
  }

  const indexPath = path.join(ANDROID_DIR, 'index.uts');
  if (!fs.existsSync(indexPath)) return;

  const source = fs.readFileSync(indexPath, 'utf8');
  const hitLines = source
    .split('\n')
    .map((line, idx) => ({ line, no: idx + 1 }))
    .filter(({ line }) => line.includes('LogFileProvider'));
  if (hitLines.length === 0) return;

  // 整个文件一次改完，避免逐行修复互相覆盖
  fail(
    'LogFileProvider',
    `${rel(indexPath)} 仍有 ${hitLines.length} 处引用（行 ${hitLines.map((h) => h.no).join(', ')}），` +
      '应移除 import 并将实现替换为空实现',
    () => {
      let next = fs.readFileSync(indexPath, 'utf8');

      // 1) 从 kotlin 模块的 import 列表里摘掉 LogFileProvider
      next = next.replace(/\s*,\s*LogFileProvider\s*(?=[,}])/, '');

      // 2) LogFileProvider 实现区块 → 空实现（区块以下一个分隔注释为界）
      next = next.replace(
        /\/\/ =+ LogFileProvider[\s\S]*?(?=\n\/\/ =+ )/,
        LOG_STUB_BLOCK.trimEnd() + '\n',
      );

      fs.writeFileSync(indexPath, next);
      console.log(`  ✓ 已清理 ${rel(indexPath)} 的 LogFileProvider 引用`);
    },
  );
}

// ==================== 执行 ====================

function runAllChecks() {
  failures = [];
  checkAndroidLibs();
  checkIosPersonalRepo();
  checkNoLogFileProvider();
  return failures;
}

function report(items) {
  const grouped = new Map();
  for (const { check, message } of items) {
    if (!grouped.has(check)) grouped.set(check, []);
    grouped.get(check).push(message);
  }
  for (const [check, messages] of grouped) {
    console.log(`✗ [${check}] ${messages.length} 项不合规`);
    for (const m of messages) {
      console.log(`    - ${m}`);
    }
    console.log('');
  }
}

function main() {
  console.log('开始发布前规范检查...\n');

  let items = runAllChecks();
  if (items.length === 0) {
    console.log('✓ 全部检查通过');
    return 0;
  }

  if (!shouldFix) {
    report(items);
    console.log(`共 ${items.length} 项不合规`);
    const fixable = items.filter((f) => f.fix).length;
    if (fixable > 0) {
      console.log(`其中 ${fixable} 项可自动修复，执行: node scripts/prerelease-check.js --fix`);
    }
    if (items.length - fixable > 0) {
      console.log(`其中 ${items.length - fixable} 项需手动处理（依赖声明不自动改）`);
    }
    return 1;
  }

  report(items);

  const fixable = items.filter((f) => f.fix);
  const manual = items.filter((f) => !f.fix);
  if (fixable.length === 0) {
    console.log('无可自动修复项，以上均需手动处理');
    return 1;
  }

  console.log(`开始修复 ${fixable.length} 项（另有 ${manual.length} 项需手动处理）...\n`);
  for (const item of fixable) {
    try {
      item.fix();
    } catch (e) {
      console.log(`  ✗ 修复失败（${item.check}）: ${e.message}`);
    }
  }

  console.log('\n修复完成，复检...\n');
  const remaining = runAllChecks();
  if (remaining.length === 0) {
    console.log('✓ 全部检查通过');
    return 0;
  }

  report(remaining);
  console.log(`仍有 ${remaining.length} 项不合规，需手动处理`);
  return 1;
}

process.exit(main());
