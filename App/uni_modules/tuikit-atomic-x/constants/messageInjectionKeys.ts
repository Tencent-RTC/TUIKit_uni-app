/**
 * Message 组件把自身的组件定义通过 provide 暴露给后代，合并转发详情页 inject 后递归渲染消息。
 *
 * 不能直接 import Message.nvue：会形成 Message → MergerMessage → MergedMessageDetail → Message 的循环依赖；
 * 也不能用 defineAsyncComponent：它内部依赖 setTimeout，nvue 的 uni-jsframework 环境下不可用。
 */
export const MESSAGE_COMPONENT_INJECTION_KEY = 'atomicx:messageComponent';

/**
 * Message 组件 provide 一个 `() => boolean`：当前这次触摸是否已触发长按。
 * nvue 长按松手后仍会补发 tap，气泡内的子组件（如合并转发卡片）用它屏蔽自己的点击，避免长按后误触发点击行为。
 */
export const MESSAGE_LONG_PRESSED_INJECTION_KEY = 'atomicx:messageLongPressed';

/**
 * 合并转发详情页 provide 一个 `() => Promise<void>`：静默重新拉取合并消息列表并替换详情页持有的副本。
 * 合并转发里的子消息不在任何会话的消息列表里，SDK 不会推送其下载结果；
 * 内容组件（如 FileMessage）下载成功后 inject 并调用它，才能让界面反映最新的本地路径。
 * 不在详情页内使用时没有提供者，inject 得到 null，调用方需判空。
 */
export const MERGED_DETAIL_REFRESH_INJECTION_KEY = 'atomicx:mergedDetailRefresh';

/**
 * MessageList provide 一个 `(message, conversationID) => void`：打开合并转发详情。
 * 详情是整页 fixed 浮层，放在 list 的 cell 里会被 cell 裁剪 / 被后续 cell 盖住，点击到不了返回按钮，
 * 所以由 MessageList 在 list 外统一承载（可多层叠加）。
 */
export const OPEN_MERGED_DETAIL_INJECTION_KEY = 'atomicx:openMergedDetail';
