<template>
  <view class="btn" @tap="handleHangup">
    <image class="btn-img" :style="[style]" :src="HANGUP_SRC"></image>
    <text class="btn-text" v-if="isShowText">
      挂断
    </text>
  </view>
</template>

<script setup lang="ts">
  import { computed } from "vue";
  import HANGUP_SRC from "../../../static/icon/hangup.png";
  import {
    useCallState
  } from '@/uni_modules/tuikit-atomic-x/state/CallState';
  const {
    hangup
  } = useCallState()

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

  const handleHangup = () => {
    hangup();
  };
</script>

<style scoped>
  .btn {
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