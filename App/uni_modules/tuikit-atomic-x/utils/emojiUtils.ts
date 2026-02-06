import { emojiUrlMap, emojiBaseUrl } from "../constants/emoji";

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
 * @param emojiSize 表情图片尺寸,默认 40rpx
 * @returns rich-text 组件的 nodes 数组
 */
export const parseEmojiToNodes = (text: string, emojiSize: string = '40rpx'): RichTextNode[] => {
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
          style: `display: inline-block; width: ${emojiSize}; height: ${emojiSize}; vertical-align: middle; margin: 0 4rpx;`
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

