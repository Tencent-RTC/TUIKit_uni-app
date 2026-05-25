#!/usr/bin/env node

/**
 * 转化兼容模式
 * 
 * 功能：将 xxx_vue 文件/目录转换为 xxx（删除原有的 xxx），使项目同时兼容 Vue2 和 Vue3
 * 
 * 使用方式：
 *   node scripts/switch-to-compatible-mode.js
 * 
 * 处理规则：
 *   1. 目录：components_compatible -> components, state_compatible -> state,
 *           quickstart_compatible -> quickstart, pages_compatible -> pages,
 *           server_compatible -> server
 *   2. 文件：utils/setSdkLanguageFromSystem_compatible.ts -> utils/setSdkLanguageFromSystem.ts
 *   3. 内容替换：扫描转换后的目录，将文件中的 _compatible 引用路径替换为正式路径
 *   4. 删除：__tests__ 目录（兼容模式不需要）
 */

const fs = require('fs');
const path = require('path');

// 获取脚本所在目录的父目录（即 tuikit-atomic-x 目录）
const ROOT_DIR = path.resolve(__dirname, '..');

// 需要转换的目录映射
const DIR_MAPPINGS = [
  { source: 'components_compatible', target: 'components' },
  { source: 'state_compatible', target: 'state' },
  { source: 'quickstart_compatible', target: 'quickstart' },
  { source: 'pages_compatible', target: 'pages' },
  { source: 'server_compatible', target: 'server' },
];

// 需要转换的文件映射
const FILE_MAPPINGS = [
  { source: 'utils/setSdkLanguageFromSystem_compatible.ts', target: 'utils/setSdkLanguageFromSystem.ts' },
];

// 需要删除的目录
const DIRS_TO_DELETE = [
  '__tests__',
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
 * 处理目录转换
 */
function processDirectories() {
  console.log('\n📁 处理目录转换...\n');
  
  for (const { source, target } of DIR_MAPPINGS) {
    const sourcePath = path.join(ROOT_DIR, source);
    const targetPath = path.join(ROOT_DIR, target);
    
    console.log(`处理: ${source} -> ${target}`);
    
    if (!fs.existsSync(sourcePath)) {
      console.log(`  ⚠ 跳过: ${source} 不存在`);
      continue;
    }
    
    // 1. 删除原有的目标目录
    removeDir(targetPath);
    
    // 2. 重命名源目录为目标目录
    rename(sourcePath, targetPath);
  }
}

/**
 * 处理文件转换
 */
function processFiles() {
  console.log('\n📄 处理文件转换...\n');
  
  for (const { source, target } of FILE_MAPPINGS) {
    const sourcePath = path.join(ROOT_DIR, source);
    const targetPath = path.join(ROOT_DIR, target);
    
    console.log(`处理: ${source} -> ${target}`);
    
    if (!fs.existsSync(sourcePath)) {
      console.log(`  ⚠ 跳过: ${source} 不存在`);
      continue;
    }
    
    // 1. 删除原有的目标文件
    removeFile(targetPath);
    
    // 2. 重命名源文件为目标文件
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

// 需要扫描并替换文件内容中 _compatible 引用的文件后缀
const REPLACEABLE_EXTENSIONS = ['.vue', '.nvue', '.js', '.ts', '.jsx', '.tsx'];

/**
 * 递归获取目录下所有符合后缀的文件
 */
function getAllFiles(dirPath, extensions) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * 替换文件内容中的 _compatible 引用路径
 * 例如：server_compatible/callService -> server/callService
 *       components_compatible/ -> components/
 *       state_compatible/ -> state/
 */
function fixCompatibleImports() {
  console.log('\n🔧 修复文件内 _compatible 引用路径...\n');

  // 构建替换规则：从 DIR_MAPPINGS 和 FILE_MAPPINGS 中提取
  const replacements = DIR_MAPPINGS.map(({ source, target }) => ({
    pattern: new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
    replacement: target,
    label: `${source} -> ${target}`
  }));

  // 文件名中的 _compatible 也需要处理
  for (const { source, target } of FILE_MAPPINGS) {
    const sourceBase = path.basename(source, path.extname(source));
    const targetBase = path.basename(target, path.extname(target));
    if (sourceBase !== targetBase) {
      replacements.push({
        pattern: new RegExp(sourceBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        replacement: targetBase,
        label: `${sourceBase} -> ${targetBase}`
      });
    }
  }

  // 扫描所有已转换的目标目录
  const dirsToScan = DIR_MAPPINGS.map(({ target }) => path.join(ROOT_DIR, target));
  
  let totalFixed = 0;
  for (const dirPath of dirsToScan) {
    if (!fs.existsSync(dirPath)) continue;
    const files = getAllFiles(dirPath, REPLACEABLE_EXTENSIONS);
    
    for (const filePath of files) {
      let content = fs.readFileSync(filePath, 'utf-8');
      let modified = false;
      
      for (const { pattern, replacement } of replacements) {
        const newContent = content.replace(pattern, replacement);
        if (newContent !== content) {
          content = newContent;
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`  ✓ 已修复: ${path.relative(ROOT_DIR, filePath)}`);
        totalFixed++;
      }
    }
  }
  
  if (totalFixed === 0) {
    console.log('  ℹ 无需修复');
  } else {
    console.log(`\n  共修复 ${totalFixed} 个文件`);
  }
}

/**
 * 主函数
 */
function main() {
  console.log('=========================================');
  console.log('🔄 转化兼容模式');
  console.log('=========================================');
  console.log(`\n工作目录: ${ROOT_DIR}\n`);
  
  // 检查根目录是否存在
  if (!fs.existsSync(ROOT_DIR)) {
    console.error(`❌ 错误: 目录不存在 ${ROOT_DIR}`);
    process.exit(1);
  }
  
  // 处理目录
  processDirectories();
  
  // 处理文件
  processFiles();
  
  // 修复文件内容中的 _compatible 引用路径
  fixCompatibleImports();
  
  // 删除不需要的目录
  deleteUnneededDirs();
  
  console.log('\n=========================================');
  console.log('✅ 兼容模式转化完成！');
  console.log('=========================================\n');
}

// 执行
main();
