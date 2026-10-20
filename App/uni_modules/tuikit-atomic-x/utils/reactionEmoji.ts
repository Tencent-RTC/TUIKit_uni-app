import { emojiBaseUrl, emojiUrlMap, emojiNameMap } from '../constants/emoji';

export interface ReactionEmoji {
  key: string;
  src: string;
}

export const QUICK_REACTION_COUNT = 6;

const RECENT_REACTION_STORAGE_KEY = 'tuikit_recent_reaction_emojis_v1';
const RECENT_REACTION_MAX_COUNT = 20;

let cachedReactionEmojiList: ReactionEmoji[] | null = null;

export const buildReactionEmojiSrc = (reactionID: string): string => {
  const fileName = emojiUrlMap[reactionID];
  return fileName ? emojiBaseUrl + fileName : '';
};

export const listAllReactionEmojis = (): ReactionEmoji[] => {
  if (cachedReactionEmojiList) return cachedReactionEmojiList;
  const list: ReactionEmoji[] = [];
  Object.keys(emojiNameMap).forEach((key) => {
    const src = buildReactionEmojiSrc(key);
    if (src) list.push({ key, src });
  });
  cachedReactionEmojiList = list;
  return list;
};

const readRecentReactionIDs = (): string[] => {
  try {
    const raw = uni.getStorageSync(RECENT_REACTION_STORAGE_KEY);
    if (Array.isArray(raw)) return raw as string[];
    if (typeof raw === 'string' && raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {}
  return [];
};

export const pushRecentReactionEmoji = (reactionID: string): void => {
  if (!buildReactionEmojiSrc(reactionID)) return;
  const nextList = [reactionID, ...readRecentReactionIDs().filter((id) => id !== reactionID)]
    .slice(0, RECENT_REACTION_MAX_COUNT);
  try {
    uni.setStorageSync(RECENT_REACTION_STORAGE_KEY, nextList);
  } catch (e) {
    console.error('[reactionEmoji] persist recent reaction failed:', e);
  }
};

export const listRecentReactionEmojis = (): ReactionEmoji[] => {
  const allEmojis = listAllReactionEmojis();
  const recent: ReactionEmoji[] = [];
  readRecentReactionIDs().forEach((id) => {
    const found = allEmojis.find((emoji) => emoji.key === id);
    if (found && recent.indexOf(found) < 0) recent.push(found);
  });
  return recent;
};

// 与 Android ReactionQuickPickerView 一致：我已回应的 > 最近使用 > 全部，去重后取前 count 个
export const listQuickReactionEmojis = (
  count: number = QUICK_REACTION_COUNT,
  reactedIDs: string[] = []
): ReactionEmoji[] => {
  const allEmojis = listAllReactionEmojis();
  const picked: ReactionEmoji[] = [];
  const pushIfNew = (emoji: ReactionEmoji | undefined) => {
    if (emoji && picked.length < count && picked.indexOf(emoji) < 0) picked.push(emoji);
  };

  reactedIDs.forEach((id) => pushIfNew(allEmojis.find((emoji) => emoji.key === id)));
  listRecentReactionEmojis().slice(0, count).forEach(pushIfNew);
  allEmojis.forEach(pushIfNew);

  return picked;
};
