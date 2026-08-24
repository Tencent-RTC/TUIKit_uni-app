# quickstart_room

多人音视频房间（TUIRoomKit）最小可跑 demo。拷贝即用。

## 一、拷贝

在 uni-app 项目根目录下执行（`$PROJ` 替换为你的项目根路径）：

```bash
QS=$PROJ/uni_modules/tuikit-atomic-x/quickstart_room

cp -R $QS/pages/index      $PROJ/pages/
cp -R $QS/pages/login      $PROJ/pages/
cp -R $QS/pages/scenes     $PROJ/pages/
cp -R $QS/static/images    $PROJ/static/
```

拷贝后目录结构：

```
pages/
  index/index.vue                首页（进入房间 / 退出登录）
  login/login.vue                登录页（填 SDKAppID / SecretKey）
  scenes/room/
    index.nvue                   房间入口（加入 / 创建）
    join/index.nvue              加入房间
    create/index.nvue            创建房间
    main/index.nvue              房间主页面
    components/                  房间内组件（麦克风/摄像头/屏幕共享/成员列表/聊天/录制…）
    hooks/useRoomTips.ts         房间事件提示（被踢/邀请/录制通知…）
    utils/errorHandler.ts        错误码 → 中文提示
static/images/
  back-black.png
  default-avatar.png
  room/                          房间场景图标（45 个）
```

## 二、填凭证

`pages/login/login.vue` 顶部三处：

```ts
const sdkAppId = 0;        // 控制台 → 应用管理 → SDKAppID
const secretKey = '';      // 控制台 → 应用管理 → 密钥
```

> `genTestUserSig` 仅用于本地调试。**上线必须改为服务端签发 userSig**，
> 前端不能存 SecretKey。

## 三、注册页面路由

把以下条目合并进 `pages.json` 的 `pages` 数组：

```json
{
  "path": "pages/login/login",
  "style": { "navigationStyle": "custom" }
},
{
  "path": "pages/index/index",
  "style": { "navigationStyle": "custom" }
},
{
  "path": "pages/scenes/room/index",
  "style": { "navigationStyle": "custom" }
},
{
  "path": "pages/scenes/room/join/index",
  "style": { "navigationStyle": "custom" }
},
{
  "path": "pages/scenes/room/create/index",
  "style": { "navigationStyle": "custom" }
},
{
  "path": "pages/scenes/room/main/index",
  "style": {
    "navigationStyle": "custom",
    "disableScroll": true,
    "disableSwipeBack": true
  }
}
```

首页设为 `pages/login/login`（`pages` 数组第一项即启动页）。

## 四、跑起来

HBuilderX → 运行 → 运行到手机或模拟器（**需要自定义基座**，标准基座没有 RTC 原生模块）。

流程：登录 → 首页「进入房间」→「创建房间」/「加入房间」→ 房间主界面。

## 备注

- **屏幕共享**：Android 开箱可用；iOS 需额外配置 Broadcast Upload Extension，三处配置如下（`group.com.xxx` 必须完全一致，不一致会推流失败）：

  1. `nativeResources/ios/ios-screenShareUpload.mobileprovision` —— 在 Apple 开发者后台为 Extension 的 Bundle ID 单独创建（需勾选 App Groups 能力）后下载。
  2. `nativeResources/ios/ios-extension.json` —— 声明 Extension：
     ```json
     {
       "ScreenShareExtension.appex": {
         "identifier": "com.xxx.upload",
         "profile": "ios-screenShareUpload.mobileprovision",
         "entitlements": {
           "com.apple.security.application-groups": ["group.com.xxx"]
         }
       }
     }
     ```
     - `identifier`：Extension 的 Bundle ID，必须是主 App Bundle ID 加后缀（主 App 为 `com.xxx` 则填 `com.xxx.upload`），且与 mobileprovision 绑定的 Bundle ID 一致
     - `profile`：上面那份 mobileprovision 的文件名（相对 `nativeResources/ios`）
     - `entitlements.com.apple.security.application-groups`：Apple 开发者后台创建的 App Group ID
  3. `nativeResources/ios/UniApp.entitlements` —— 主 App 侧的 App Groups 授权（上面 `ios-extension.json` 里的 entitlements 只对 Extension 生效，主 App 需要这份文件才能与 Extension 共享数据）：
     ```xml
     <?xml version="1.0" encoding="UTF-8"?>
     <plist version="1.0">
       <dict>
         <key>com.apple.security.application-groups</key>
         <array>
           <string>group.com.xxx</string>
         </array>
       </dict>
     </plist>
     ```
  4. 项目根目录 `Info.plist` —— 原生侧靠 `TUIRoomAppGroup` 读取 App Group，缺失即返回 12061：
     ```xml
     <?xml version="1.0" encoding="UTF-8"?>
     <plist version="1.0">
       <dict>
         <key>TUIRoomAppGroup</key>
         <string>group.com.xxx</string>
       </dict>
     </plist>
     ```

  改完需**重新制作自定义基座**才生效。
- **云端录制**：仅房主/管理员可见入口，需在控制台开通录制服务。
- **聊天面板**：房间内 IM 聊天走 `useMessageListState`，无需额外接入。
- 全部 import 走 `@/uni_modules/tuikit-atomic-x`，不依赖 chat quickstart。
