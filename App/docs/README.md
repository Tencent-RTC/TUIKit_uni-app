# 文档生成工具使用指南

## 工具简介

本目录包含 atomicx-core sdk 的 API 文档生成工具链。通过解析 State 文件中的 JSDoc 注释和 UTS 接口定义，自动生成可视化的 HTML API 文档，同时支持将文档内容同步更新到 `uni-app.json`，作为腾讯云官网文档的数据源。

### 工作流程

```
State 文件（14个 .ts）──┐
                        │  JSDoc 解析
                        ├──────────────→ index.html（按模块分组的 API 文档）
interface.uts ── UTS→TS ┘               interface.html（接口类型定义文档）
                                              │
                                              │  HTML 内容提取
                                              ▼
                                        uni-app.json（官网文档数据源）
```

## 文件结构

```
docs/
├── config.js              # 文档生成配置（数据源路径、输出目录）
├── generate-typedoc.js    # 主文档生成脚本（解析 JSDoc → 生成 HTML）
├── update-uni-app-json.js # 官网文档更新脚本（从 HTML 提取 → 更新 JSON）
├── styles.css             # 文档样式表
├── tsconfig.json          # TypeScript 配置
├── package.json           # 依赖配置与 npm scripts
└── output/                # 文档输出目录（自动生成）
    ├── api/
    │   ├── index.html     # API 接口文档（按模块分组）
    │   └── interface.html # 接口类型定义文档
    ├── assets/
    │   ├── styles.css     # 文档样式表（复制自根目录）
    │   └── search.js      # 文档搜索功能脚本（自动生成）
    └── uni-app.json       # 官网文档数据源
```

## 数据源

脚本从以下文件中解析 JSDoc 注释来生成文档，配置位于 `config.js`：

### State 文件（14 个）

| 文件 | 模块 |
|------|------|
| `state/LoginState.ts` | 登录 |
| `state/LiveListState.ts` | 直播列表 |
| `state/LiveSeatState.ts` | 直播麦位 |
| `state/LiveAudienceState.ts` | 直播观众 |
| `state/CoGuestState.ts` | 连麦 |
| `state/CoHostState.ts` | 主播连线 |
| `state/BattleState.ts` | 主播 PK |
| `state/DeviceState.ts` | 设备管理 |
| `state/AudioEffectState.ts` | 音效 |
| `state/BarrageState.ts` | 弹幕 |
| `state/BaseBeautyState.ts` | 基础美颜 |
| `state/GiftState.ts` | 礼物 |
| `state/LikeState.ts` | 点赞 |
| `state/CallState.ts` | 音视频通话 |

### 接口定义文件

- `utssdk/interface.uts`：所有接口类型定义，会先转换为 `.ts` 再解析

如需新增模块，在 `config.js` 的 `stateFiles` 数组中添加对应文件路径即可。

## JSDoc 标签约定

脚本通过解析 JSDoc 注释来提取文档信息，编写注释时需遵循以下约定：

### 函数注释

```typescript
/**
 * 函数的描述说明
 * @param {ParamType} paramName - 参数描述
 * @example
 * functionName({ key: 'value' });
 * @memberof module:ModuleName
 */
export function functionName(options: ParamType) { ... }
```

### 响应式数据注释

```typescript
/**
 * 数据的描述说明
 * @type {DataType}
 * @example
 * console.log(dataName.value);
 * @memberof module:ModuleName
 */
const dataName = ref<DataType>(initialValue);
```

### 模块描述注释

在 State 文件中添加模块级别的描述：

```typescript
/**
 * @module_description
 * 模块的详细介绍内容，支持多行。
 * 会被渲染为模块标题下方的介绍卡片。
 */
```

### 支持的 JSDoc 标签

| 标签 | 用途 | 示例 |
|------|------|------|
| `@memberof module:Name` | 指定归属模块（必需） | `@memberof module:LoginState` |
| `@module_description` | 模块整体介绍 | 见上方示例 |
| `@param {Type} name - desc` | 函数参数说明 | `@param {string} userId - 用户ID` |
| `@example` | 使用示例代码 | 见上方示例 |
| `@remarks` | 补充说明（支持 Markdown 表格） | `@remarks \| 列1 \| 列2 \|` |
| `@internal` | 标记为内部数据，不输出到文档 | `@internal` |
| `@interface InterfaceName` | 标记接口类型，生成属性表格 | `@interface UserInfo` |

> **注意**：没有 `@memberof` 标签或 `module` 为 `default` 的函数/数据会被过滤，不会出现在文档中。

## 使用步骤

以下所有命令均在 `docs/` 目录下执行：

### 1. 安装依赖

```bash
npm install
```

### 2. 生成 HTML 文档

运行主文档生成脚本，生成 `index.html` 和 `interface.html`：

```bash
npm run generate
```

### 3. 更新 uni-app.json（官网文档）

从已生成的 HTML 中提取结构化信息，增量更新到 `uni-app.json`：

```bash
npm run update-json
```

> **重要**：必须先执行步骤 2 再执行步骤 3，因为 `update-uni-app-json.js` 依赖 `output/api/index.html` 的内容。

### 4. 查看生成的文档

文档生成成功后，直接在浏览器中打开 `docs/output/api/index.html` 即可查看。

## 生成产物说明

### HTML 文档（Step 2 产物）

| 文件 | 说明 |
|------|------|
| `output/api/index.html` | API 接口文档，按模块分组展示响应式数据和接口函数，包含侧边栏目录和搜索功能 |
| `output/api/interface.html` | 接口类型定义文档，展示所有 `interface.uts` 中的类型及其属性表格 |
| `output/assets/search.js` | 文档页内搜索功能 |
| `output/assets/styles.css` | 文档样式（双栏布局、响应式设计） |

### uni-app.json（Step 3 产物）

`output/uni-app.json` 包含：
- SDK 概述说明内容
- 各模块的专业描述
- 每个模块的 **响应式数据** 表格（名称链接 + 描述）
- 每个模块的 **接口函数** 表格（名称链接 + 描述）
- 所有链接指向 `https://liteav.sdk.qcloud.com/doc/product/tuikit/atomic-x/uni-app/zh/v1.0/api/`

脚本采用 **增量更新** 策略：已存在的模块不会被覆盖，只补充缺失的内容。

## 注意事项

### generate-typedoc.js
1. 文档生成过程会自动创建 `temp/` 临时目录并在完成后清理
2. 如果需要修改文档样式，编辑根目录下的 `styles.css` 文件（会被复制到 output）
3. 如需调整数据源，修改 `config.js` 中的 `stateFiles` 数组
4. 接口类型参数如果是自定义类型（大写字母开头），会自动生成到 `interface.html` 的跳转链接

### update-uni-app-json.js
1. 执行前必须确保 `output/api/index.html` 已正确生成
2. 执行前必须确保 `output/uni-app.json` 文件存在且格式正确
3. 脚本会自动检测并保留 JSON 文件中的现有结构和 ID 信息
4. 脚本会自动去重：移除重复的 h2 标题和重复的"响应式数据"节
5. 对于缺少描述的方法，会根据方法名前缀（`add`/`remove`/`set`/`get`）自动生成默认描述