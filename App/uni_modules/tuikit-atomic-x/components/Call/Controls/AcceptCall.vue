<template>
  <view class="btn" @tap="handleAccept">
    <image class="btn-img" :style="[style]" :src="ACCEPT_SRC"></image>
    <text class="btn-text" v-if="isShowText">
      接听
    </text>
  </view>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import ACCEPT_SRC from "../../../static/icon/accept.png";
  import {
    useCallState
  } from '@/uni_modules/tuikit-atomic-x/state/CallState';
  import { useDeviceState } from '@/uni_modules/tuikit-atomic-x/state/DeviceState';
  import { checkCallPermissionWithDialog } from "@/uni_modules/tuikit-atomic-x/utils/callPermission";
  import { stopAndResetAudio } from "../../../server/callService"
  const {
    accept,
    reject,
    activeCall
  } = useCallState()
  const {
    openLocalMicrophone,
  } = useDeviceState();

  const props = defineProps({
    size: {
      type: Number,
      default: 60,
    },
    isShowText: {
      type: Boolean,
      default: true,
    },
  });

  const style = computed(() => ({
    width: props.size + "px",
    height: props.size + "px",
  }));

  const handleAccept = async () => {
    const hasPermission = await checkCallPermissionWithDialog(activeCall.value.mediaType);
    if (!hasPermission) { return reject() };
    stopAndResetAudio()
    openLocalMicrophone({
      fail: (error) => {
        if (error === -1104) {
          setTimeout(() => {
            openLocalMicrophone();
          }, 200);
        }
      }
    })
    accept();
  };
</script>

<style scoped>
  .btn {
    width: 60px;
    margin: 10px 20px;
  }

  .btn-img {
    width: 60px;
    height: 60px;
    border-radius: 140px;
  }

  .btn-text {
    font-size: 12px;
    color: #d5e0f2;
    font-weight: 400;
    text-align: center;
    margin-top: 10px;
  }
</style>