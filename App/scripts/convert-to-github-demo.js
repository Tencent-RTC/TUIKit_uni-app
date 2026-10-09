#!/usr/bin/env node

/**
 * 将内部 demo 转化为 github demo 的脚本
 * 使用方法: npm run convert-to-github
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, '..');

console.log('开始转换为 GitHub Demo...');
console.log(`项目目录: ${PROJECT_DIR}`);

/**
 * 安全删除文件
 */
function removeFile(filePath) {
  const fullPath = path.join(PROJECT_DIR, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
}

/**
 * 安全删除目录（递归）
 */
function removeDir(dirPath) {
  const fullPath = path.join(PROJECT_DIR, dirPath);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    return true;
  }
  return false;
}

/**
 * 重命名文件
 */
function renameFile(oldPath, newPath) {
  const fullOldPath = path.join(PROJECT_DIR, oldPath);
  const fullNewPath = path.join(PROJECT_DIR, newPath);
  if (fs.existsSync(fullOldPath)) {
    fs.renameSync(fullOldPath, fullNewPath);
    return true;
  }
  return false;
}

/**
 * 检查文件是否存在
 */
function fileExists(filePath) {
  return fs.existsSync(path.join(PROJECT_DIR, filePath));
}

// 1. loginService-github 重命名为 loginService，原有 loginService 删除
console.log('\n2. 处理登录服务...');
if (fileExists('server/loginService-github.ts')) {
  removeFile('server/loginService.ts');
  renameFile('server/loginService-github.ts', 'server/loginService.ts');
  console.log('   ✓ loginService-github.ts -> loginService.ts');
  console.log('   ✓ 引用路径无需修改（文件已重命名）');
} else {
  console.log('   ⚠ loginService-github.ts 不存在，跳过');
}

// 2. 删除 inner-constants
console.log('\n3. 删除内部常量文件...');
if (removeFile('server/inner-constants.ts')) {
  console.log('   ✓ 已删除 inner-constants.ts');
} else {
  console.log('   ⚠ inner-constants.ts 不存在，跳过');
}

// 3. 删除 static/html 目录（验证码页面）
console.log('\n4. 删除验证码页面...');
if (removeDir('static/html')) {
  console.log('   ✓ 已删除 static/html 目录');
} else {
  console.log('   ⚠ static/html 不存在，跳过');
}

// 4. 删除 Push 相关文件和目录
console.log('\n5. 删除 Push 相关内容...');

// 删除 pushService.ts
if (removeFile('server/pushService.ts')) {
  console.log('   ✓ 已删除 server/pushService.ts');
} else {
  console.log('   ⚠ pushService.ts 不存在，跳过');
}

// 删除 TencentCloud-Push 模块
if (removeDir('uni_modules/TencentCloud-Push')) {
  console.log('   ✓ 已删除 uni_modules/TencentCloud-Push');
} else {
  console.log('   ⚠ TencentCloud-Push 不存在，跳过');
}

// 删除 nativeResources 目录（包含 timpush-configs.json 等推送配置）
if (removeDir('nativeResources')) {
  console.log('   ✓ 已删除 nativeResources 目录');
} else {
  console.log('   ⚠ nativeResources 不存在，跳过');
}

// 修改 App.vue，删除 pushService 相关代码
if (fileExists('App.vue')) {
  const appVuePath = path.join(PROJECT_DIR, 'App.vue');
  let appVueContent = fs.readFileSync(appVuePath, 'utf8');
  // 删除 import pushService（保留行尾换行符，只删除该行内容）
  appVueContent = appVueContent.replace(/^\s*import\s*{\s*pushService\s*}\s*from\s*['"]\.\/server\/pushService['"];?\s*\n/gm, '');
  // 删除 pushService.init()（保留行尾换行符，只删除该行内容）
  appVueContent = appVueContent.replace(/^\s*pushService\.init\(\);?\s*\n/gm, '');
  fs.writeFileSync(appVuePath, appVueContent, 'utf8');
  console.log('   ✓ 已清理 App.vue 中的 pushService 代码');
} else {
  console.log('   ⚠ App.vue 不存在，跳过');
}

// 5b. 删除项目根目录 Info.plist（iOS 屏幕分享扩展的 TUIRoomAppGroup 配置）
// 文件含内部 App Group（group.com.tencent.tuikit.demo.xa），不能出现在 GitHub demo。
// nativeResources/ 目录已在上一步整体删除，但 Info.plist 在项目根目录，
// 不属于 nativeResources/，需要单独处理。
console.log('\n5b. 删除 iOS 屏幕分享扩展 Info.plist...');
if (removeFile('Info.plist')) {
  console.log('   ✓ 已删除 Info.plist（含内部 TUIRoomAppGroup）');
} else {
  console.log('   ⚠ Info.plist 不存在，跳过');
}

// 删除 constants.ts 中的 NOTIFICATION_CHANNEL_CONFIG
if (fileExists('server/constants.ts')) {
  const constantsPath = path.join(PROJECT_DIR, 'server/constants.ts');
  let constantsContent = fs.readFileSync(constantsPath, 'utf8');
  constantsContent = constantsContent.replace(/\/\*\*\s*\n\s*\*\s*通知渠道配置\s*\n\s*\*\/\s*\nexport\s+const\s+NOTIFICATION_CHANNEL_CONFIG\s*=\s*\{[^}]*\};\s*\n*/g, '');
  fs.writeFileSync(constantsPath, constantsContent, 'utf8');
  console.log('   ✓ 已删除 constants.ts 中的 NOTIFICATION_CHANNEL_CONFIG');
} else {
  console.log('   ⚠ constants.ts 不存在，跳过');
}

// 5. 删除 AIRules 目录
console.log('\n6. 删除 AIRules 目录...');
if (removeDir('AIRules')) {
  console.log('   ✓ 已删除 AIRules 目录');
} else {
  console.log('   ⚠ AIRules 不存在，跳过');
}

// 6. 删除 docs 目录
console.log('\n7. 删除 docs 目录...');
if (removeDir('docs')) {
  console.log('   ✓ 已删除 docs 目录');
} else {
  console.log('   ⚠ docs 不存在，跳过');
}

// 7. 清空 manifest.json 中的 appid
console.log('\n8. 清空 manifest.json 中的 appid...');
if (fileExists('manifest.json')) {
  const manifestPath = path.join(PROJECT_DIR, 'manifest.json');
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const updatedContent = manifestContent.replace(/"appid"\s*:\s*"[^"]*"/, '"appid" : ""');
  fs.writeFileSync(manifestPath, updatedContent, 'utf8');
  console.log('   ✓ 已清空 manifest.json 中的 appid');
} else {
  console.log('   ⚠ manifest.json 不存在，跳过');
}

// 8. 清空 GenerateTestUserSig.js 中的敏感信息
console.log('\n9. 清空 GenerateTestUserSig.js 中的敏感信息...');
if (fileExists('debug/GenerateTestUserSig.js')) {
  const userSigPath = path.join(PROJECT_DIR, 'debug/GenerateTestUserSig.js');
  let userSigContent = fs.readFileSync(userSigPath, 'utf8');
  userSigContent = userSigContent.replace(/let\s+SDKAppID\s*=\s*\d+/, 'let SDKAppID = 0');
  userSigContent = userSigContent.replace(/let\s+SDKSECRETKEY\s*=\s*"[^"]*"/, 'let SDKSECRETKEY = ""');
  userSigContent = userSigContent.replace(/let\s+AppKey\s*=\s*"[^"]*"/, 'let AppKey = ""');
  fs.writeFileSync(userSigPath, userSigContent, 'utf8');
  console.log('   ✓ 已清空 SDKAppID、SDKSECRETKEY、AppKey');
} else {
  console.log('   ⚠ GenerateTestUserSig.js 不存在，跳过');
}

// 9. 删除 package.json 中的 convert-to-github 命令
console.log('\n10. 清理 package.json 中的转换命令...');
if (fileExists('package.json')) {
  const packagePath = path.join(PROJECT_DIR, 'package.json');
  let packageContent = fs.readFileSync(packagePath, 'utf8');
  // 删除 convert-to-github 命令
  packageContent = packageContent.replace(/,\s*"convert-to-github":\s*"[^"]*"/, '');
  packageContent = packageContent.replace(/"convert-to-github":\s*"[^"]*",?\s*/, '');
  // 删除 vue2 命令（Vue2 QuickStart 转化脚本，仅内部 demo 用）
  packageContent = packageContent.replace(/,\s*"vue2":\s*"[^"]*"/, '');
  packageContent = packageContent.replace(/"vue2":\s*"[^"]*",?\s*/, '');
  // 删除 room 命令（房间 QuickStart 转化脚本，仅内部 demo 用）
  packageContent = packageContent.replace(/,\s*"room":\s*"[^"]*"/, '');
  packageContent = packageContent.replace(/"room":\s*"[^"]*",?\s*/, '');
  fs.writeFileSync(packagePath, packageContent, 'utf8');
  console.log('   ✓ 已删除 package.json 中的 convert-to-github / vue2 / room 命令');
} else {
  console.log('   ⚠ package.json 不存在，跳过');
}

// 10. 删除 scripts 目录（自我删除）
console.log('\n11. 删除 scripts 目录...');
if (removeDir('scripts')) {
  console.log('   ✓ 已删除 scripts 目录');
} else {
  console.log('   ⚠ scripts 不存在，跳过');
}

console.log('\n=========================================');
console.log('转换完成！');
console.log('=========================================');
console.log('\n请注意检查以下内容：');
console.log('1. login.vue 中的导入路径是否正确');
console.log('2. 确保没有其他文件引用 inner-constants.ts');
console.log('3. 测试应用是否正常运行');
