#!/usr/bin/env node

/**
 * 将当前 Vue3 工程转化为 Vue2 quickstart 工程
 * 使用方法: node scripts/convert-to-vue2-quickstart.js
 *
 * 步骤：
 *   1) 删除 AIRules / components / debug / docs / server 目录
 *   2) 清空 pages / static 目录
 *   3) 重写 App.vue 的 script，仅保留 callService 的引入和初始化
 *   4) 替换 pages.json 内容
 *   5) manifest.json 的 vueVersion 改为 "2"
 *   6) 执行 uni_modules/tuikit-atomic-x/scripts/switch-to-compatible-mode.js
 *   7) 拷贝 quickstart 下的 static / pages 到工程根
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = path.resolve(__dirname, '..');

console.log('开始转换为 Vue2 quickstart 工程...');
console.log(`项目目录: ${PROJECT_DIR}`);

// ==================== 工具函数 ====================

function removeDir(relPath) {
  const fullPath = path.join(PROJECT_DIR, relPath);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    return true;
  }
  return false;
}

function emptyDir(relPath) {
  const fullPath = path.join(PROJECT_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    return false;
  }
  for (const entry of fs.readdirSync(fullPath)) {
    fs.rmSync(path.join(fullPath, entry), { recursive: true, force: true });
  }
  return true;
}

function writeFile(relPath, content) {
  const fullPath = path.join(PROJECT_DIR, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

function readFile(relPath) {
  return fs.readFileSync(path.join(PROJECT_DIR, relPath), 'utf8');
}

function fileExists(relPath) {
  return fs.existsSync(path.join(PROJECT_DIR, relPath));
}

// ==================== 步骤 1：删除指定目录 ====================
console.log('\n[1/7] 删除 AIRules / components / debug / docs / server ...');
const dirsToRemove = ['AIRules', 'components', 'debug', 'docs', 'server'];
for (const dir of dirsToRemove) {
  const removed = removeDir(dir);
  console.log(`  - ${dir}: ${removed ? '已删除' : '不存在，跳过'}`);
}

// ==================== 步骤 2：清空 pages / static ====================
console.log('\n[2/7] 清空 pages / static ...');
for (const dir of ['pages', 'static']) {
  const cleared = emptyDir(dir);
  console.log(`  - ${dir}: ${cleared ? '已清空' : '已新建（原本不存在）'}`);
}

// ==================== 步骤 3：重写 App.vue ====================
console.log('\n[3/7] 重写 App.vue ...');
const appVueContent = `<script>
import { initCallService } from '@/uni_modules/tuikit-atomic-x/server/callService';
initCallService();
</script>

<style>
  uni-page-body,
  html,
  body,
  page {
    width: 100% !important;
    height: 100% !important;
    overflow: hidden;
  }
</style>
`;
writeFile('App.vue', appVueContent);
console.log('  - App.vue 已重写');

// ==================== 步骤 4：替换 pages.json 内容 ====================
console.log('\n[4/7] 替换 pages.json 内容 ...');
const pagesJsonContent = `{
  "pages": [
    {
      "path": "pages/login/login",
      "style": {
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/index/index",
      "style": {
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/scenes/chat/conversationList/conversationList",
      "style": {
        "navigationStyle": "custom",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
      "path": "pages/scenes/chat/chat/index",
      "style": {
        "navigationStyle": "custom",
        "backgroundColor": "#f5f5f5",
        "app-plus": {
          "titleNView": false
        }
      }
    },
    {
      "path": "pages/scenes/chat/chatSetting/index",
      "style": {
        "navigationStyle": "custom",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
      "path": "pages/scenes/chat/groupManagement/index",
      "style": {
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/scenes/chat/groupMemberList/index",
      "style": {
        "navigationStyle": "custom",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
      "path": "pages/scenes/chat/search/search",
      "style": {
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/scenes/chat/search/searchInConversation",
      "style": {
        "navigationStyle": "custom"
      }
    },
    {
      "path": "pages/scenes/chat/userPicker/userPicker",
      "style": {
        "navigationBarTitleText": "选人列表",
        "navigationBarBackgroundColor": "#ffffff",
        "navigationBarTextStyle": "black",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
      "path": "pages/scenes/chat/createGroup/createGroup",
      "style": {
        "navigationBarTitleText": "创建群聊",
        "navigationBarBackgroundColor": "#ffffff",
        "navigationBarTextStyle": "black",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
      "path": "pages/scenes/chat/groupTypeInfo/groupTypeInfo",
      "style": {
        "navigationBarTitleText": "选择群类型",
        "navigationBarBackgroundColor": "#ffffff",
        "navigationBarTextStyle": "black",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
      "path": "pages/scenes/chat/videoPlayer/videoPlayer",
      "style": {
        "app-plus": {
          "titleNView": false,
          "screenOrientation": [
            "portrait-primary",
            "landscape-primary",
            "landscape-secondary"
          ]
        }
      }
    },
    {
      "path": "pages/scenes/chat/contacts/contactList/index",
      "style": {
        "navigationStyle": "custom",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
      "path": "pages/scenes/chat/contacts/contactInfo/index",
      "style": {
        "navigationStyle": "custom",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
      "path": "pages/scenes/chat/contacts/addFriend/index",
      "style": {
        "navigationStyle": "custom",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
      "path": "pages/scenes/chat/contacts/addGroup/index",
      "style": {
        "navigationStyle": "custom",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
      "path": "pages/scenes/chat/contacts/contactList/friendApplicationList",
      "style": {
        "navigationStyle": "custom",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
      "path": "pages/scenes/chat/contacts/contactList/groupApplicationList",
      "style": {
        "navigationStyle": "custom",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
      "path": "pages/scenes/chat/contacts/contactList/groupList",
      "style": {
        "navigationStyle": "custom",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
      "path": "pages/scenes/chat/contacts/contactList/blackList",
      "style": {
        "navigationStyle": "custom",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
      "path": "pages/scenes/chat/contacts/applicationVerify/index",
      "style": {
        "navigationStyle": "custom",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
      "path": "pages/scenes/chat/contacts/setRemark/index",
      "style": {
        "navigationStyle": "custom",
        "backgroundColor": "#f5f5f5"
      }
    },
    {
   	"path": "uni_modules/tuikit-atomic-x/pages/call",
       	"style": {
       	  "navigationBarTitleText": "",
       	  "navigationStyle": "custom"
       	}
    }
  ],
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#147AFF",
    "borderStyle": "black",
    "backgroundColor": "#ffffff",
    "list": [
      {
        "pagePath": "pages/scenes/chat/conversationList/conversationList",
        "text": "消息",
        "iconPath": "static/tuikit/message.png",
        "selectedIconPath": "static/tuikit/message-selected.png"
      },
      {
        "pagePath": "pages/scenes/chat/contacts/contactList/index",
        "text": "通讯录",
        "iconPath": "static/tuikit/relation.png",
        "selectedIconPath": "static/tuikit/relation-selected.png"
      }
    ]
  },
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "腾讯云 IM",
    "navigationBarBackgroundColor": "#EBF0F6",
    "backgroundColor": "#F8F8F8"
  }
}
`;
writeFile('pages.json', pagesJsonContent);
console.log('  - pages.json 已替换');

// ==================== 步骤 5：manifest.json vueVersion → "2" ====================
console.log('\n[5/7] 修改 manifest.json vueVersion → "2" ...');
if (!fileExists('manifest.json')) {
  console.error('  - manifest.json 不存在，终止');
  process.exit(1);
}
let manifestText = readFile('manifest.json');
// manifest.json 是带注释的 JSONC，按文本替换 vueVersion 字段
const vueVersionRegex = /("vueVersion"\s*:\s*")[^"]*(")/;
if (vueVersionRegex.test(manifestText)) {
  manifestText = manifestText.replace(vueVersionRegex, '$12$2');
} else {
  // 没有该字段则在结尾对象前插入
  manifestText = manifestText.replace(/\}\s*$/, ',\n    "vueVersion" : "2"\n}\n');
}
writeFile('manifest.json', manifestText);
console.log('  - manifest.json vueVersion 已设为 "2"');

// ==================== 步骤 6：执行 switch-to-compatible-mode ====================
console.log('\n[6/7] 执行 switch-to-compatible-mode.js ...');
const switchScript = path.join(
  PROJECT_DIR,
  'uni_modules/tuikit-atomic-x/scripts/switch-to-compatible-mode.js'
);
if (!fs.existsSync(switchScript)) {
  console.error(`  - 脚本不存在：${switchScript}`);
  process.exit(1);
}
try {
  execSync(`node "${switchScript}"`, { stdio: 'inherit', cwd: PROJECT_DIR });
} catch (err) {
  console.error('  - switch-to-compatible-mode.js 执行失败');
  process.exit(1);
}

// ==================== 步骤 7：拷贝 quickstart 下的 static / pages ====================
console.log('\n[7/7] 拷贝 quickstart static / pages 到工程根 ...');
const quickstartDir = path.join(
  PROJECT_DIR,
  'uni_modules/tuikit-atomic-x/quickstart'
);
if (!fs.existsSync(quickstartDir)) {
  console.error(`  - quickstart 目录不存在：${quickstartDir}`);
  process.exit(1);
}

function copyDirContents(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirContents(
  path.join(quickstartDir, 'static'),
  path.join(PROJECT_DIR, 'static')
);
console.log('  - static 已拷贝');

copyDirContents(
  path.join(quickstartDir, 'pages'),
  path.join(PROJECT_DIR, 'pages')
);
console.log('  - pages 已拷贝');

console.log('\n转换完成。');
