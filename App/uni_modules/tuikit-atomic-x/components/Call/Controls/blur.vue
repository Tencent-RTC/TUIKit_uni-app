<template>
  <view class="btn" @tap="handleBlur">
    <image class="btn-img" :style="[style]" :src="BLUR_OFF_SRC"></image>
    <text class="btn-text" v-if="isShowText">背景模糊</text>
  </view>
</template>

<script setup lang="ts">
  import { computed, ref } from "vue";
  import BLUR_ON_SRC from "../../../static/icon/blur-on.png";
  import BLUR_OFF_SRC from "../../../static/icon/blur-off.png";
  import {
    useCallState
  } from '@/uni_modules/tuikit-atomic-x/state/CallState';
  const {
    enableVirtualBackground
  } = useCallState()
  const isBlur = ref(false)
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

  const handleBlur = () => {
    enableVirtualBackground(!isBlur.value)
    isBlur.value = !isBlur.value
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