<template>
  <view class="btn" @click="toggleFloatWindow">
    <image class="btn-img" :style="iosFixStyle" :src="FLOAT_WINDOW_SRC"></image>
  </view>
</template>

<script setup lang="ts">
  import { ref, watch } from "vue";
  import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';
  import FLOAT_WINDOW_SRC from "../../../static/icon/float-window.png";

  const {
    allParticipants,
    startFloatWindow,
    stopFloatWindow,
  } = useCallState();
  const isFloatWindowOpen = ref(false);

  // iOS 端图片渲染存在镜像问题，通过旋转 270 度修正
  const isIOS = uni.getSystemInfoSync().platform === 'ios';
  const iosFixStyle = isIOS ? { transform: 'rotate(90deg)' } : {};

  /**
   * 将 /static/ 相对路径转为原生层可用的本地绝对路径
   */
  function toAbsolutePath(relativePath: string): string {
    if (plus && plus.io && plus.io.convertLocalFileSystemURL) {
      return plus.io.convertLocalFileSystemURL(relativePath);
    }
    return relativePath;
  }

  /**
   * 批量转换对象中所有 value 的路径为绝对路径
   */
  function convertIconPaths(iconMap: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {};
    Object.keys(iconMap).forEach(key => {
      result[key] = toAbsolutePath(iconMap[key]);
    });
    return result;
  }

  const waitingAnimation = toAbsolutePath("/static/images/callview-loading.gif");

  const volumeLevelIcons = convertIconPaths({
    "Mute": "/static/images/callview-self-mute.png",
    "Low": "/static/images/callview-network.png",
    "Medium": "/static/images/callview-network.png",
    "High": "/static/images/callview-network.png",
    "Peak": "/static/images/callview-network.png"
  });

  const networkQualityIcons = convertIconPaths({
    "BAD": "/static/images/callview-network-bad.png",
    "VERY_BAD": "/static/images/callview-network-bad.png"
  });

  const DEFAULT_AVATAR_URL = "https://liteav.sdk.qcloud.com/app/res/picture/voiceroom/avatar/user_avatar1.png";
  let defaultAvatarLocalPath = "";
  const avatarCache: Record<string, string> = {};
  const participantAvatars = ref<Record<string, string>>({});

  // 预下载默认头像并缓存
  downloadAvatar(DEFAULT_AVATAR_URL).then(localPath => {
    defaultAvatarLocalPath = localPath;
    console.log('[FloatWindow] default avatar cached:', localPath);
  });

  function getDefaultAvatarPath(): string {
    return defaultAvatarLocalPath || "";
  }

  function downloadAvatar(url: string): Promise<string> {
    if (avatarCache[url]) {
      return Promise.resolve(avatarCache[url]);
    }
    return new Promise((resolve) => {
      uni.downloadFile({
        url,
        success: (res: any) => {
          if (res.statusCode === 200) {
            const absolutePath = plus.io.convertLocalFileSystemURL(res.tempFilePath);
            console.log('[FloatWindow] downloadAvatar success, temp:', res.tempFilePath, 'absolute:', absolutePath);
            avatarCache[url] = absolutePath;
            resolve(absolutePath);
          } else {
            console.warn('[FloatWindow] downloadAvatar failed, statusCode:', res.statusCode, url);
            resolve(getDefaultAvatarPath());
          }
        },
        fail: (err: any) => {
          console.error('[FloatWindow] downloadAvatar error:', url, err);
          resolve(getDefaultAvatarPath());
        }
      });
    });
  }

  async function updateParticipantAvatars(participants: any[]) {
    if (!participants || participants.length === 0) {
      participantAvatars.value = {};
      return;
    }
    const avatarMap: Record<string, string> = {};
    const tasks: Promise<void>[] = [];
    participants.forEach(participant => {
      if (participant.id && participant.avatarURL) {
        tasks.push(
          downloadAvatar(participant.avatarURL).then(localPath => {
            avatarMap[participant.id] = localPath;
          })
        );
      } else if (participant.id) {
        avatarMap[participant.id] = getDefaultAvatarPath();
      }
    });
    await Promise.all(tasks);
    console.log('[FloatWindow] participantAvatars updated:', avatarMap);
    participantAvatars.value = avatarMap;
  }

  watch(() => allParticipants.value, async (newVal) => {
    if (!newVal) {
      return;
    }
    await updateParticipantAvatars(newVal);
  }, {
    immediate: true,
    deep: true
  });

  // 切换悬浮窗状态（500ms 内只能触发一次）
  let isToggling = false;
  const toggleFloatWindow = () => {
    if (isToggling) {
      console.warn('[FloatWindow] toggleFloatWindow throttled, ignoring');
      return;
    }
    isToggling = true;
    setTimeout(() => { isToggling = false; }, 500);

    if (isFloatWindowOpen.value) {
      stopFloatWindow();
      isFloatWindowOpen.value = false;
    } else {
      startFloatWindow({
        avatars: participantAvatars.value,
        waitingAnimation: waitingAnimation,
        volumeLevelIcons: volumeLevelIcons,
        networkQualityIcons: networkQualityIcons,
      }, (code, message) => {
        if (code !== -1) {
          isFloatWindowOpen.value = true;
          uni.navigateBack({
            delta: 1,
            fail: () => {
              uni.redirectTo({
                url: uni.$lastPage
              });
            }
          });
        }
        console.error(`show FloatWindow, code: ${code}, message: ${message} `)
      });
    }
  };
</script>

<style scoped>
  .btn {
    width: 48px;
    height: 48px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .btn-img {
    width: 24px;
    height: 24px;
  }
</style>