<template>
    <view v-if="message?.flow === 'out' &&  message?.status !== 'success'" class="message-status" :class="positionClass">

      <view v-if="message?.status === 'unSend'" class="status-loading">
        <image :src="IMG_LOADING" />
      </view>
      
      <view v-if="message?.status === 'fail'" class="status-fail">
        <text>!</text>
      </view>
    </view>
  </template>
  
  <script lang="ts" setup>
  import IMG_LOADING from '../../../assets/chat/message-loading.svg';
  
  const { message } = defineProps({
    message: {
      type: Object,
      required: true
    }
  })
  </script>
  
  <style lang="scss" scoped>
  .message-status {
    position: absolute;
    bottom: 14px;
    right: -4px;
  }
  
  .status-loading {
    width: 20px;
    height: 20px;
    
    image {
      width: 100%;
      height: 100%;
      animation: rotating 1s linear infinite;
    }
  }
  
  .status-fail {
    width: 16px;
    height: 16px;
    background-color: #ff4d4f;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    text {
      color: white;
      font-size: 12px;
      font-weight: bold;
    }
  }
  
  @keyframes rotating {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  </style>
  