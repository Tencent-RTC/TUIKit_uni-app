/**
 * @ mention 纯函数工具
 *
 * 双端共用（Vue3 主版本与 Vue2 _compatible 版本均 import 此文件）。
 * 不依赖任何 Vue API，便于单元测试。
 */

/** @所有人 在 atUserList 中的约定值，与 IM SDK 协议常量保持一致 */
export const AT_ALL_TAG = '__kImSDK_MesssageAtALL__';

/**
 * atUserList 的最大长度（含 @所有人）
 *
 * 与 IM SDK 协议保持一致：单条消息最多 @ 30 个用户，超过则消息发送失败。
 * @所有人 也占用一个 slot。
 */
export const MAX_AT_USER_COUNT = 30;

export interface MentionSegment {
  /** userID；'AT_ALL_TAG' 表示 @所有人 */
  userID: string;
  /** 文本中展示的名字（@ 后那部分） */
  displayName: string;
  /** @ 字符在文本中的位置 */
  start: number;
  /** @ 段尾（含末尾空格）的位置 */
  end: number;
}

export interface MentionContext {
  /** 光标当前是否处于 @ 上下文 */
  active: boolean;
  /** @ 字符位置；active=false 时为 -1 */
  anchor: number;
  /** @ 后已输入的过滤词 */
  keyword: string;
}

export interface InsertResult {
  newText: string;
  newCursor: number;
}

/**
 * 检测光标当前是否处于 @ 上下文
 *
 * 规则：从光标位置往前扫，遇到 @ 即激活；遇到空格 / 换行 / 字符串首则结束。
 */
export const detectMentionContext = (text: string, cursor: number): MentionContext => {
  let i = cursor - 1;
  while (i >= 0) {
    const ch = text[i];
    if (ch === '@') {
      return { active: true, anchor: i, keyword: text.slice(i + 1, cursor) };
    }
    if (ch === ' ' || ch === '\n') {
      return { active: false, anchor: -1, keyword: '' };
    }
    i--;
  }
  return { active: false, anchor: -1, keyword: '' };
};

/**
 * 选中候选人后回填文本
 *
 * 把 [anchor, anchor + 1 + keywordLen] 这段（即 `@keyword`）替换为 `@displayName `（含尾部空格）
 */
export const insertMention = (
  text: string,
  anchor: number,
  keywordLen: number,
  displayName: string
): InsertResult => {
  const segment = `@${displayName} `;
  const newText = text.slice(0, anchor) + segment + text.slice(anchor + 1 + keywordLen);
  return { newText, newCursor: anchor + segment.length };
};

/**
 * 派生扫描所有合法 mention 段
 *
 * 核心思想：mention 段不维护增量状态，每次 input 后基于当前文本 + selectedMembers 重新派生。
 * 用户手改文本破坏 `@displayName ` 段时，下一次扫描该段就不再保留，atUserList 自动剥离。
 *
 * @param text 当前文本
 * @param selectedMembers Map<displayName, userID> —— 历史选中过的成员
 */
export const scanMentions = (
  text: string,
  selectedMembers: Map<string, string>
): MentionSegment[] => {
  const result: MentionSegment[] = [];
  selectedMembers.forEach((userID, displayName) => {
    const needle = `@${displayName} `;
    let idx = text.indexOf(needle);
    while (idx !== -1) {
      result.push({
        userID,
        displayName,
        start: idx,
        end: idx + needle.length,
      });
      idx = text.indexOf(needle, idx + needle.length);
    }
  });
  return result.sort((a, b) => a.start - b.start);
};

/**
 * 整体删除：当用户在 mention 段尾部按一次退格时，把整段 `@displayName ` 一次性删掉
 *
 * 触发条件：
 * 1. 文本仅删除了 1 个字符（oldText.length - newText.length === 1）
 * 2. 删除位置正好是某个 mention 段的尾部（m.end === oldCursor）
 *
 * @returns 命中则返回新文本与光标；未命中返回 null（调用方走默认行为）
 */
export const tryDeleteWholeMention = (
  oldText: string,
  newText: string,
  oldCursor: number,
  oldMentions: MentionSegment[]
): InsertResult | null => {
  if (oldText.length - newText.length !== 1) return null;
  const hit = oldMentions.find((m) => m.end === oldCursor);
  if (!hit) return null;
  const finalText = oldText.slice(0, hit.start) + oldText.slice(hit.end);
  return { newText: finalText, newCursor: hit.start };
};
