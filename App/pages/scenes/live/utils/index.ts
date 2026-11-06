import { rpxToPx } from '../../../../uni_modules/tuikit-atomic-x/utils/unitUtils';

declare const uni: any;

const getTopBarOffsetPx = (): number => {
  try {
    const statusBarTop = (uni.getSystemInfoSync().safeArea as any)?.top || 0;
    return statusBarTop + rpxToPx(8);
  } catch (e) {
    return rpxToPx(88);
  }
};

const LIVE_SUMMARY_BACKGROUND_IMAGE = '/static/images/live/background/summary-bg.jpg';
const LIVE_ENDED_BACKGROUND_IMAGE = '/static/images/live/background/live-ended-shade.jpg';
const LIVE_MUTE_PLACEHOLDER_IMAGE = '/static/images/live/background/mute-local-video.jpg';

const LIVE_IMAGE_ASSETS: string[] = [
  '/static/images/live/background/start-btn-bg.png',
  '/static/images/live/badge/badge-gradient-advanced.png',
  '/static/images/live/badge/badge-gradient-basic.png',
  '/static/images/live/badge/badge-gradient-elite.png',
  '/static/images/live/badge/badge-gradient-premium.png',
  '/static/images/live/badge/badge-icon-advanced.png',
  '/static/images/live/badge/badge-icon-basic.png',
  '/static/images/live/badge/badge-icon-elite.png',
  '/static/images/live/badge/badge-icon-premium.png',
  '/static/images/live/badge/tip-bg-elite.png',
  '/static/images/live/badge/tip-bg-premium.png',
  '/static/images/live/icon/cap-hdr.png',
  '/static/images/live/icon/cap-quality.png',
  '/static/images/live/icon/cap-sleep.png',
  '/static/images/live/icon/cap-superResolution.png',
  '/static/images/live/icon/cap-volumeEqualizer.png',
  '/static/images/live/icon/close.png',
  '/static/images/live/icon/co-guest.png',
  '/static/images/live/icon/co-guest-connected.png',
  '/static/images/live/icon/co-guest-disconnect.png',
  '/static/images/live/icon/co-guest-manage.png',
  '/static/images/live/icon/co-guest-more.png',
  '/static/images/live/icon/co-guest-request.png',
  '/static/images/live/icon/comic-connected-wave.png',
  '/static/images/live/icon/end-live.png',
  '/static/images/live/icon/fan-club.png',
  '/static/images/live/icon/gift.png',
  '/static/images/live/icon/more-grid.png',
  '/static/images/live/icon/more-share-arrow.png',
  '/static/images/live/icon/pk.png',
  '/static/images/live/icon/prepare-beauty.png',
  '/static/images/live/icon/prepare-comments.png',
  '/static/images/live/icon/prepare-flip.png',
  '/static/images/live/icon/prepare-grid4.png',
  '/static/images/live/icon/prepare-mic-off.png',
  '/static/images/live/icon/prepare-mic-on.png',
  '/static/images/live/icon/prepare-mirror-on.png',
  '/static/images/live/icon/prepare-music.png',
  '/static/images/live/icon/prepare-pause.png',
  '/static/images/live/icon/prepare-quality.png',
  '/static/images/live/icon/prepare-share.png',
  '/static/images/live/icon/prepare-sound-effect.png',
  '/static/images/live/icon/prepare-sticker.png',
  '/static/images/live/icon/start-dot.png',
  '/static/images/live/icon/status-audio.png',
  '/static/images/live/icon/status-audio-off.png',
  '/static/images/live/icon/status-network.png',
  '/static/images/live/icon/status-network-bad.png',
  '/static/images/live/icon/status-network-disconnected.png',
  '/static/images/live/icon/status-network-poor.png',
  '/static/images/live/icon/status-network-trigger-bad.png',
  '/static/images/live/icon/status-network-trigger-disconnected.png',
  '/static/images/live/icon/status-network-trigger-poor.png',
  '/static/images/live/icon/status-video.png',
  '/static/images/live/icon/status-video-error.png',
  '/static/images/live/icon/status-video-off.png',
  '/static/images/live/icon/summary-back.png',
  '/uni_modules/tuikit-atomic-x/static/assets/live/default-avatar.png',
  '/uni_modules/tuikit-atomic-x/static/assets/live/drawer-bg.png',
  '/uni_modules/tuikit-atomic-x/static/assets/live/drawer-glow.png',
  '/uni_modules/tuikit-atomic-x/static/assets/live/co-mic-control-bar-bg.png',
  '/uni_modules/tuikit-atomic-x/static/assets/live/co-mic-split-bg.png',
];

type PreloadImagesHandle = {
  cancel: () => void;
};

const preloadLiveImages = (
  list: string[] = LIVE_IMAGE_ASSETS,
  concurrency = 3
): PreloadImagesHandle => {
  let cancelled = false;
  let cursor = 0;
  const runNext = () => {
    if (cancelled) return;
    const src = list[cursor++];
    if (!src) return;
    const finish = () => {
      if (cancelled) return;
      setTimeout(runNext, 0);
    };
    try {
      uni.getImageInfo({ src, success: finish, fail: finish });
    } catch (e) {
      finish();
    }
  };
  const lanes = Math.min(Math.max(1, concurrency), list.length);
  for (let i = 0; i < lanes; i++) {
    runNext();
  }
  return {
    cancel: () => {
      cancelled = true;
    },
  };
};

export type { PreloadImagesHandle };
export {
  getTopBarOffsetPx,
  LIVE_IMAGE_ASSETS,
  LIVE_SUMMARY_BACKGROUND_IMAGE,
  LIVE_ENDED_BACKGROUND_IMAGE,
  LIVE_MUTE_PLACEHOLDER_IMAGE,
  preloadLiveImages,
};
