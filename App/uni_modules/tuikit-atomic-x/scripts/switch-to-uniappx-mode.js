#!/usr/bin/env node

/**
 * 转化为 uniappx 模式
 *
 * 功能：将 xxx_uniappx 目录/文件转换为 xxx（删除原有的 xxx），
 *      删除其它与 uniappx 无关的文件/目录，使项目最终只保留 uniappx 版本。
 *
 * 使用方式：
 *   node scripts/switch-to-uniappx-mode.js
 *
 * 处理规则：
 *   1. 目录重命名（删除 _uniappx 后缀）：
 *      components_uniappx -> components
 *      state_uniappx      -> state
 *      hooks_uniappx      -> hooks
 *      constants_uniappx  -> constants
 *      server_uniappx     -> server
 *      types_uniappx      -> types
 *      utils_uniappx      -> utils
 *      pages_uniappx      -> pages
 *      quickstart_uniappx -> quickstart
 *   2. 保留不动：styles/、static/、utssdk/、scripts/（脚本所在目录）
 *                顶层 changelog.md / package.json / readme.md / shims-nvue.d.ts
 *   3. 删除：除保留项外的其它目录与顶层文件
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// _uniappx 后缀目录映射
const DIR_MAPPINGS = [
  { source: 'components_uniappx', target: 'components' },
  { source: 'state_uniappx', target: 'state' },
  { source: 'hooks_uniappx', target: 'hooks' },
  { source: 'constants_uniappx', target: 'constants' },
  { source: 'server_uniappx', target: 'server' },
  { source: 'types_uniappx', target: 'types' },
  { source: 'utils_uniappx', target: 'utils' },
  { source: 'pages_uniappx', target: 'pages' },
  { source: 'quickstart_uniappx', target: 'quickstart' },
];

// 保留的目录（脚本所在目录必须保留，否则下次无法执行）
const KEEP_DIRS = ['styles', 'static', 'utssdk', 'scripts'];

// 保留的顶层文件
const KEEP_FILES = ['changelog.md', 'package.json', 'readme.md', 'shims-nvue.d.ts'];

// 要删除的目录（含非 _uniappx 版本的同名目录，避免重命名时冲突）
const DIRS_TO_DELETE = [
  '__tests__',
  'components',
  'components_compatible',
  'constants',
  'constants_compatible',
  'debug',
  'docs',
  'hooks',
  'pages',
  'pages_compatible',
  'quickstart',
  'quickstart_compatible',
  'server',
  'server_compatible',
  'state',
  'state_compatible',
  'types',
  'utils',
];

/**
 * 递归删除目录
 */
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`  ✓ 已删除: ${path.relative(ROOT_DIR, dirPath)}`);
    return true;
  }
  return false;
}

/**
 * 删除文件
 */
function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`  ✓ 已删除: ${path.relative(ROOT_DIR, filePath)}`);
    return true;
  }
  return false;
}

/**
 * 重命名目录或文件
 */
function rename(sourcePath, targetPath) {
  if (fs.existsSync(sourcePath)) {
    fs.renameSync(sourcePath, targetPath);
    console.log(`  ✓ 已重命名: ${path.relative(ROOT_DIR, sourcePath)} -> ${path.relative(ROOT_DIR, targetPath)}`);
    return true;
  } else {
    console.log(`  ⚠ 源不存在: ${path.relative(ROOT_DIR, sourcePath)}`);
    return false;
  }
}

/**
 * 处理目录转换（删除 _uniappx 后缀）
 * 依赖：调用前必须先把 DIRS_TO_DELETE 全部删完（避免误删刚 rename 的同名目录）
 */
function processDirectories() {
  console.log('\n📁 处理目录转换（删除 _uniappx 后缀）...\n');

  for (const { source, target } of DIR_MAPPINGS) {
    const sourcePath = path.join(ROOT_DIR, source);
    const targetPath = path.join(ROOT_DIR, target);

    console.log(`处理: ${source} -> ${target}`);

    if (!fs.existsSync(sourcePath)) {
      console.log(`  ⚠ 跳过: ${source} 不存在`);
      continue;
    }

    // target 已在 deleteUnneededDirs 阶段删完，直接 rename 即可
    rename(sourcePath, targetPath);
  }
}

/**
 * 删除不需要的目录
 */
function deleteUnneededDirs() {
  console.log('\n🗑️  删除不需要的目录...\n');

  for (const dir of DIRS_TO_DELETE) {
    const dirPath = path.join(ROOT_DIR, dir);
    console.log(`删除: ${dir}`);
    removeDir(dirPath);
  }
}

/**
 * 删除不需要的顶层文件
 */
function deleteUnneededFiles() {
  console.log('\n🗑️  删除不需要的顶层文件...\n');

  const entries = fs.readdirSync(ROOT_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && !KEEP_FILES.includes(entry.name)) {
      const filePath = path.join(ROOT_DIR, entry.name);
      console.log(`删除: ${entry.name}`);
      removeFile(filePath);
    }
  }
}

/**
 * 主函数
 */
function main() {
  console.log('=========================================');
  console.log('🔄 转化为 uniappx 模式');
  console.log('=========================================');
  console.log(`\n工作目录: ${ROOT_DIR}\n`);

  if (!fs.existsSync(ROOT_DIR)) {
    console.error(`❌ 错误: 目录不存在 ${ROOT_DIR}`);
    process.exit(1);
  }

  // 1. 先删除所有不需要的目录（含 _uniappx 目标同名目录，
  //    避免后面 rename 完成后被统一删除阶段误删）
  deleteUnneededDirs();

  // 2. 再删除不需要的顶层文件
  deleteUnneededFiles();

  // 3. 最后把 _uniappx 目录重命名为去后缀的正式目录
  processDirectories();

  console.log('\n=========================================');
  console.log('✅ uniappx 模式转化完成！');
  console.log('=========================================\n');
}

// 执行
main();
