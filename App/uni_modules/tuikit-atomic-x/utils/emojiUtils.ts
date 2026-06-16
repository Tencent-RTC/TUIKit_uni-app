import { emojiUrlMap, emojiBaseUrl, emojiNameMap } from "../constants/emoji";

// emoji 中文名 -> key 的反查表，模块级缓存避免每次发送都重建
let _emojiNameToKeyMap: Record<string, string> | null = null;
const getEmojiNameToKeyMap = (): Record<string, string> => {
  if (_emojiNameToKeyMap) return _emojiNameToKeyMap;
  const map: Record<string, string> = {};
  Object.keys(emojiNameMap).forEach(key => {
    map[(emojiNameMap as Record<string, string>)[key]] = key;
  });
  _emojiNameToKeyMap = map;
  return map;
};

/**
 * 输入侧：把文本中的 [TUIEmoji_Xxx] key 替换为人类可读的中文名 [xxx]
 * 例：'你好[TUIEmoji_Smile]' -> '你好[微笑]'
 */
export const transformEmojiKeyToName = (text: string): string => {
  if (!text) return '';
  return text.replace(/\[TUIEmoji_[^\]]+\]/g, match => {
    const name = (emojiNameMap as Record<string, string>)[match];
    return name || match;
  });
};

/**
 * 发送侧：把文本中的中文名 [xxx] 反查回 [TUIEmoji_Xxx] key
 * 例：'你好[微笑]' -> '你好[TUIEmoji_Smile]'
 */
export const transformEmojiNameToKey = (text: string): string => {
  if (!text) return '';
  const nameToKey = getEmojiNameToKeyMap();
  return text.replace(/\[[^\[\]]+\]/g, match => nameToKey[match] || match);
};

export interface RichTextNode {
  name?: string;
  attrs?: Record<string, any>;
  children?: RichTextNode[];
  type?: string;
  text?: string;
}

/**
 * 解析文本中的表情 key,转换为 rich-text nodes 格式
 * @param text 原始文本
 * @param emojiSize 表情图片尺寸,默认 36rpx（接近文字行高，rich-text 下视觉与文字自然对齐）
 * @returns rich-text 组件的 nodes 数组
 */
export const parseEmojiToNodes = (text: string, emojiSize: string = '36rpx'): RichTextNode[] => {
  const nodes: RichTextNode[] = [];
  const emojiRegex = /\[TUIEmoji_[^\]]+\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = emojiRegex.exec(text)) !== null) {
    // 添加表情前的文本
    if (match.index > lastIndex) {
      nodes.push({
        type: 'text',
        text: text.substring(lastIndex, match.index)
      });
    }

    // 添加表情图片
    const emojiKey = match[0];
    const emojiFileName = emojiUrlMap[emojiKey];
    if (emojiFileName) {
      nodes.push({
        name: 'img',
        attrs: {
          src: emojiBaseUrl + emojiFileName,
          // 注意：rich-text 渲染路径无法精确控制对齐，TextMessage 已改用 parseTextToSegments
          // 自渲染。这里保留 parseEmojiToNodes 是为了 ConversationList / Search 等使用 rich-text
          // 的场景仍能工作，emoji 尺寸由调用方传入。
          style: `display: inline-block; width: ${emojiSize}; height: ${emojiSize};`
        }
      });
    } else {
      // 如果没有对应的表情,保留原文本
      nodes.push({
        type: 'text',
        text: emojiKey
      });
    }

    lastIndex = emojiRegex.lastIndex;
  }

  // 添加剩余文本
  if (lastIndex < text.length) {
    nodes.push({
      type: 'text',
      text: text.substring(lastIndex)
    });
  }

  return nodes;
}

/**
 * 检查文本中是否包含表情
 * @param text 原始文本
 * @returns 是否包含表情
 */
export const hasEmoji = (text: string): boolean => {
  const emojiRegex = /\[TUIEmoji_[^\]]+\]/;
  return emojiRegex.test(text);
};

/**
 * 文本段（字符级）/ 表情段，用于 nvue 中以 view + flex-wrap 自渲染图文混排
 *
 * 因为 nvue rich-text 无法控制 vertical-align/line-height，导致 emoji 与文字对齐失控；
 * 而 nvue 的 <text> 节点又不能内嵌 <image>。唯一可靠方案是：
 *   外层 <view flex-direction:row flex-wrap:wrap align-items:center>
 *   每个字符 / 每个 emoji 作为独立子节点
 *   align-items:center 强制对齐
 *   flex-wrap:wrap 自动换行
 *
 * 中文场景下每字符一节点性能可接受（一条 IM 消息通常 < 200 字）；英文单词会被拆字符，
 * 仍可读，但失去单词整体不被换行打断的特性，对 IM 场景可接受。
 */
export interface TextSegment {
  type: 'char';
  text: string; // 单个字符（含中英文 / 数字 / 标点 / 空格）
}
export interface EmojiSegment {
  type: 'emoji';
  src: string;  // PNG 完整 URL
  key: string;  // [TUIEmoji_Xxx]
}
export type TextOrEmojiSegment = TextSegment | EmojiSegment;

/**
 * 解析文本为字符级 + emoji 段数组
 *
 * 例：'你好[TUIEmoji_Smile]hi'
 * → [
 *     { type:'char', text:'你' },
 *     { type:'char', text:'好' },
 *     { type:'emoji', src:'...', key:'[TUIEmoji_Smile]' },
 *     { type:'char', text:'h' },
 *     { type:'char', text:'i' }
 *   ]
 */
export const parseTextToSegments = (text: string): TextOrEmojiSegment[] => {
  const segments: TextOrEmojiSegment[] = [];
  if (!text) return segments;

  const emojiRegex = /\[TUIEmoji_[^\]]+\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // 把一段普通文本切成字符级 segments；优先 Array.from 处理 surrogate pair（unicode emoji 等）
  const pushChars = (plain: string): void => {
    if (!plain) return;
    const chars = Array.from(plain);
    for (let i = 0; i < chars.length; i++) {
      segments.push({ type: 'char', text: chars[i] });
    }
  };

  while ((match = emojiRegex.exec(text)) !== null) {
    // emoji 前的纯文本段
    if (match.index > lastIndex) {
      pushChars(text.substring(lastIndex, match.index));
    }

    const emojiKey = match[0];
    const emojiFileName = emojiUrlMap[emojiKey];
    if (emojiFileName) {
      segments.push({
        type: 'emoji',
        src: emojiBaseUrl + emojiFileName,
        key: emojiKey
      });
    } else {
      // 没有对应资源，降级为原文本字符
      pushChars(emojiKey);
    }

    lastIndex = emojiRegex.lastIndex;
  }

  // 收尾：最后一段纯文本
  if (lastIndex < text.length) {
    pushChars(text.substring(lastIndex));
  }

  return segments;
};

