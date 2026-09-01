# quickstart_room

多人音视频房间（TUIRoomKit）最小可跑 demo。拷贝即用。

## 一、拷贝

【windows 端】
```bash
xcopy /E /I /Y "uni_modules\tuikit-atomic-x\quickstart_room\static\*" "static\" && xcopy /E /I /Y "uni_modules\tuikit-atomic-x\quickstart_room\pages\*" "pages\"
```

【Mac 端】
```bash
cp -r uni_modules/tuikit-atomic-x/quickstart_room/static/* static/ && cp -r uni_modules/tuikit-atomic-x/quickstart_room/pages/* pages/
```

拷贝后目录结构：

```
pages/
  index/index.vue                首页（进入房间 / 退出登录）
  login/login.vue                登录页（填 SDKAppID / SecretKey）
  scenes/room/
    index.nvue                   房间入口（加入 / 创建 / 预定）
    join/index.nvue              加入房间
    create/index.nvue            创建房间
    schedule/index.nvue          预定房间（时间/时长/时区/成员/密码）
    scheduleDetail/index.nvue    预定详情（修改 / 取消 / 入会）
    main/index.nvue              房间主页面
    roomInvite/index.nvue        来电邀请页（铃声 + 震动 + 滑动接听）
    components/                  房间内组件（麦克风/摄像头/屏幕共享/成员列表/聊天/录制/选人/时区…）
    hooks/useRoomTips.ts         房间事件提示（被踢/邀请/录制通知…）
    utils/errorHandler.ts        错误码 → 中文提示
    utils/scheduleUtils.ts       预定房间的时间格式化 / 房间号生成
    utils/timezones.ts           全球时区表（UTC-12 ~ +14）+ 墙上时间 ⇄ UTC 换算
static/
  images/
    back-black.png
    default-avatar.png
    room/                        房间场景图标（59 个）
  phone_ringing.mp3              来电铃声（roomInvite 页循环播放）
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
  "path": "pages/scenes/room/schedule/index",
  "style": { "navigationStyle": "custom" }
},
{
  "path": "pages/scenes/room/scheduleDetail/index",
  "style": { "navigationStyle": "custom" }
},
{
  "path": "pages/scenes/room/main/index",
  "style": {
    "navigationStyle": "custom",
    "disableScroll": true,
    "disableSwipeBack": true
  }
},
{
  "path": "pages/scenes/room/roomInvite/index",
  "style": {
    "navigationStyle": "custom",
    "disableScroll": true,
    "disableSwipeBack": true,
    "backgroundColor": "#000000",
    "app-plus": {
      "titleNView": false,
      "animationType": "slide-in-bottom"
    }
  }
}
```

## 四、初始化来电邀请服务（必做，否则收不到邀请）

`roomCallService.ts` 负责监听会议邀请信令并全屏拉起 `roomInvite` 页。**必须在 `App.vue` 的 `onLaunch` 里调用一次**：

```ts
// App.vue
<script lang="ts">
  import { initRoomCallService } from '@/uni_modules/tuikit-atomic-x/server/roomCallService';

  export default {
    onLaunch: function () {
      // 会议邀请（被叫方）：订阅 RoomEvent.onCallReceived 全屏拉起邀请页
      initRoomCallService();
    },
  };
</script>
```

## 五、跑起来

HBuilderX → 运行 → 运行到手机或模拟器（**需要自定义基座**，标准基座没有 RTC 原生模块）。

流程：登录 → 首页「进入房间」→「创建房间」/「加入房间」/「预定房间」→ 房间主界面。

被邀请方：收到邀请信令 → 自动拉起 `roomInvite` 来电页（铃声 + 震动）→ 滑动接听进房 / 点「暂不进入」拒绝。

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
- **预定房间**：`schedule/index.nvue` 的时区选择用 `utils/timezones.ts`（固定 UTC 偏移，**不处理夏令时**）。SDK 的 `scheduleStartTime` 是 UTC 秒级时间戳，页面内部按「UTC 为唯一真值 + 展示时换算到所选时区」处理。
- **来电邀请**：初始化见上文「四、初始化来电邀请服务」。铃声用 `static/phone_ringing.mp3`（`obeyMuteSwitch: false` 使 iOS 静音模式下也响），震动每 2 秒一次。
- **成员选择**：`components/SelectMemberPanel` 选中超过 10 人时 footer 从「头像横滑」切为「已选择：N人 ⌃ + 可展开列表」。
- 全部 import 走 `@/uni_modules/tuikit-atomic-x`，不依赖 chat quickstart。
