/**
 * 离线推送 (offlinePushInfo) 计算工具
 *
 * 由 MessageInput / ToolsPanel 在每次发送消息前调用，
 * 让业务方通过 setOfflinePushInfo prop 注入的 resolver 回调计算 push 配置。
 */

import type {
  OfflinePushInfo,
  OfflinePushInfoResolver,
  OfflinePushContext,
} from '../types/message';

/**
 * 安全调用业务方注入的 resolver 计算 offlinePushInfo
 *
 * 使用约束：
 * - 同步函数；resolver 不应做异步操作
 * - 抛异常视为返回 undefined，组件不阻断 send
 * - 返回 null / undefined / 任意 falsy 值 → 视为"不附带 push"
 *
 * @param resolver 业务方注入的 push 计算函数（可能为 undefined）
 * @param ctx 当前发送上下文（messageType / messagePayload / conversationID）
 * @returns 应附带的 offlinePushInfo；undefined 表示不附带
 */
export const buildOfflinePushInfo = (
  resolver: OfflinePushInfoResolver | undefined,
  ctx: OfflinePushContext
): OfflinePushInfo | undefined => {
  if (!resolver) return undefined;
  try {
    const result = resolver(ctx);
    return result || undefined;
  } catch (e) {
    console.error('[buildOfflinePushInfo] resolver threw, fallback to no push', e);
    return undefined;
  }
};
