import type { MessageInfo, MessageReaction } from '../types/message';
import type { UserProfile } from '../types/userProfile';
import { useMessageActionState } from '../state/MessageActionState';
import { pushRecentReactionEmoji } from './reactionEmoji';
import { emitPremiumRequired } from './premiumRequired';

const pendingReactionKeys = new Set<string>();

export const isReactedByMyself = (message: MessageInfo, reactionID: string): boolean => {
  return (message.reactionList || []).some(
    (reaction) => reaction.reactionID === reactionID && reaction.reactedByMyself
  );
};

export const resolveReactionUserName = (user: UserProfile | undefined): string => {
  if (!user) return '';
  return user.nickname || user.userID || '';
};

export interface ReactionChipText {
  name: string;
  suffix: string;
}

// 展示前 3 个回应者（顿号分隔）；拼接 >= 20 字符时追加 suffix「等N人」（CSS 端 name 由 ellipsis 截断）
export const buildReactionChipText = (reaction: MessageReaction): ReactionChipText => {
  const total = reaction.totalUserCount || 0;
  if (total <= 0) return { name: '', suffix: '' };
  const topNames = (reaction.partialUserList || [])
    .slice(0, 3)
    .map((u) => resolveReactionUserName(u))
    .filter(Boolean);
  const name = topNames.join('、');
  // 有未列出的回应者时一定显示「等N人」；名字拼接过长（被截断）时也显示
  const suffix = total > topNames.length || name.length >= 20 ? `等${total}人` : '';
  return { name, suffix };
};

const isPremiumRequired = (error: any): boolean => /premium edition/i.test(error?.message || '');

export const resolveReactionError = (error: any): string => {
  const msg: string = error?.message || '';
  if (isPremiumRequired(error)) return '消息表情回应功能仅旗舰版支持，请升级后使用';
  if (/does not exist/i.test(msg)) return '该回应不存在或已被删除';
  if (/max reaction limit/i.test(msg)) return '回应数量已达上限';
  return msg || '操作失败';
};

const runReaction = async (
  message: MessageInfo,
  reactionID: string,
  mode: 'toggle' | 'remove',
  keepStore: boolean
): Promise<boolean> => {
  const pendingKey = `${message.msgID}:${reactionID}`;
  if (pendingReactionKeys.has(pendingKey)) return false;
  pendingReactionKeys.add(pendingKey);

  const actionState = useMessageActionState({ message });
  try {
    if (mode === 'remove' || isReactedByMyself(message, reactionID)) {
      await actionState.removeReaction(reactionID);
    } else {
      await actionState.addReaction(reactionID);
      pushRecentReactionEmoji(reactionID);
    }
    return true;
  } catch (error) {
    console.error('[messageReaction] reaction failed:', error);
    if (isPremiumRequired(error)) {
      emitPremiumRequired(resolveReactionError(error));
    } else {
      uni.showToast({ title: resolveReactionError(error), icon: 'none', duration: 2000 });
    }
    return false;
  } finally {
    pendingReactionKeys.delete(pendingKey);
    if (!keepStore) actionState.destroyStore();
  }
};

export const toggleMessageReaction = (message: MessageInfo, reactionID: string, keepStore = false): Promise<boolean> =>
  runReaction(message, reactionID, 'toggle', keepStore);

export const removeMessageReaction = (message: MessageInfo, reactionID: string): Promise<boolean> =>
  runReaction(message, reactionID, 'remove', true);
