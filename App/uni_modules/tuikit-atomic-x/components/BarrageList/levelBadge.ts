const levelTier = (level: number): string => {
  if (level >= 40) return 'elite';
  if (level >= 25) return 'premium';
  if (level >= 10) return 'advanced';
  return 'basic';
};

const resolveMsgLevel = (message: any): number => {
  const lv = Number(message?.sender?.level);
  if (!isNaN(lv) && lv > 0) return lv;
  return 0;
};

const levelBadgeUrl = (level: number): string =>
  '/uni_modules/tuikit-atomic-x/static/assets/live/level-badge-' + levelTier(level) + '.png';

export { levelTier, resolveMsgLevel, levelBadgeUrl };
