#!/usr/bin/env node

/**
 * 将当前工程替换为 quickstart_room（多人音视频房间）最小 demo 工程
 * 使用方法: npm run room  （或 node scripts/convert-to-room-quickstart.js）
 *
 * 步骤：
 *   1) 清空 pages / static 目录
 *   2) 替换 pages.json（登录 → 首页 → 房间入口/加入/创建/预定/预定详情/主页面/来电邀请）
 *   3) 拷贝 quickstart_room 下的 static / pages 到工程根
 *
 * 与 convert-to-vue2-quickstart.js 的差异：
 *   - 不动 App.vue / manifest.json（room 走 Vue3 script setup，不切 compatible 模式）
 *   - 不删 debug/server（login 页依赖 debug/GenerateTestUserSig，App.vue 依赖 server/callService）
 *   - 不配 tabBar（room 是单入口流程，没有多 tab）
 *
 * 注意：App.vue 需保留 `initRoomCallService()` 调用（onLaunch 内），否则收不到会议邀请。
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, '..');
const QUICKSTART_DIR = path.join(PROJECT_DIR, 'uni_modules/tuikit-atomic-x/quickstart_room');

console.log('开始替换为 quickstart_room 工程...');
console.log(`项目目录: ${PROJECT_DIR}`);

if (!fs.existsSync(QUICKSTART_DIR)) {
  console.error(`quickstart_room 目录不存在：${QUICKSTART_DIR}`);
  process.exit(1);
}

// ==================== 步骤 1：清空 pages / static ====================
console.log('\n[1/3] 清空 pages / static ...');
for (const dir of ['pages', 'static']) {
  const full = path.join(PROJECT_DIR, dir);
  if (fs.existsSync(full)) {
    for (const entry of fs.readdirSync(full)) {
      fs.rmSync(path.join(full, entry), { recursive: true, force: true });
    }
    console.log(`  - ${dir}: 已清空`);
  } else {
    fs.mkdirSync(full, { recursive: true });
    console.log(`  - ${dir}: 已新建`);
  }
}

// ==================== 步骤 2：替换 pages.json ====================
console.log('\n[2/3] 替换 pages.json ...');
const pagesJson = {
  pages: [
    { path: 'pages/login/login', style: { navigationStyle: 'custom' } },
    { path: 'pages/index/index', style: { navigationStyle: 'custom' } },
    { path: 'pages/scenes/room/index', style: { navigationStyle: 'custom' } },
    { path: 'pages/scenes/room/join/index', style: { navigationStyle: 'custom' } },
    { path: 'pages/scenes/room/quickstart/index', style: { navigationStyle: 'custom' } },
    { path: 'pages/scenes/room/schedule/index', style: { navigationStyle: 'custom' } },
    { path: 'pages/scenes/room/schedule/detail/index', style: { navigationStyle: 'custom' } },
    {
      path: 'pages/scenes/room/meeting/index',
      style: { navigationStyle: 'custom', disableScroll: true, disableSwipeBack: true },
    },
    {
      // 来电邀请页：底部弹出转场 + 黑底防白闪；禁止右滑返回，否则会滑出未处理的邀请
      path: 'pages/scenes/room/join/invitation/index',
      style: {
        navigationStyle: 'custom',
        disableScroll: true,
        disableSwipeBack: true,
        backgroundColor: '#000000',
        'app-plus': {
          titleNView: false,
          animationType: 'slide-in-bottom',
        },
      },
    },
  ],
  globalStyle: {
    navigationBarTextStyle: 'black',
    navigationBarTitleText: '腾讯云 RTC',
    navigationBarBackgroundColor: '#EBF0F6',
    backgroundColor: '#F8F8F8',
  },
};
fs.writeFileSync(
  path.join(PROJECT_DIR, 'pages.json'),
  JSON.stringify(pagesJson, null, 2) + '\n',
  'utf8'
);
console.log(`  - pages.json 已替换（${pagesJson.pages.length} 个页面，无 tabBar）`);

// ==================== 步骤 3：拷贝 quickstart_room ====================
console.log('\n[3/3] 拷贝 quickstart_room static / pages 到工程根 ...');
for (const dir of ['static', 'pages']) {
  const src = path.join(QUICKSTART_DIR, dir);
  if (!fs.existsSync(src)) continue;
  const dest = path.join(PROJECT_DIR, dir);
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? fs.cpSync(s, d, { recursive: true }) : fs.copyFileSync(s, d);
  }
  console.log(`  - ${dir} 已拷贝`);
}

console.log('\n替换完成。下一步：');
console.log('  1. 填 pages/login/login.vue 顶部的 sdkAppId / secretKey');
console.log('  2. 确认 App.vue 的 onLaunch 里有 initRoomCallService()（否则收不到会议邀请）');
console.log('  3. HBuilderX 运行到手机（需自定义基座，标准基座没有 RTC 原生模块）');
