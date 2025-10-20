<template>
  <input class="input-wrapper" v-model="inputValue" placeholder="说点什么…" confirm-type="send" @confirm="sendMessage">
  </input>
</template>

<script setup lang="ts">
  import {
    ref, watch
  } from "vue";
  import {
    useBarrageState
  } from "@/uni_modules/tuikit-atomic-x/state/BarrageState";
  import { useLiveAudienceState } from '@/uni_modules/tuikit-atomic-x/state/LiveAudienceState';
  const {
    sendTextMessage,
  } = useBarrageState(uni?.$liveID);
  const { audienceList } = useLiveAudienceState(uni?.$liveID);
  const inputValue = ref("");
  const isDisableSendMessage = ref(false);
  const sendMessage = (event : any) => {
    if (isDisableSendMessage.value) {
      uni.showToast({ title: '当前直播间内,您已被禁言', icon: 'none' });
      inputValue.value = '';
      return;
    }
    const value = event.detail.value;
    console.warn('inputValue = ', inputValue, uni?.$liveID);
    sendTextMessage({
      liveID: uni?.$liveID,
      text: value,
      success: () => {
        console.log('sendTextMessage success');
      },
      fail: (code, msg) => {
        console.error(`sendTextMessage failed, code: ${code}, msg: ${msg}`);
      },
    })
    inputValue.value = ""
  };

  watch(audienceList, (newValue, oldValue) => {
    (newValue || []).forEach((obj, index) => {
      if (obj?.userID === uni.$userID) {
        const oldUserInfo = (oldValue || [])[index] || {};
        if (obj.isMessageDisabled && !oldUserInfo?.isMessageDisabled) {
          isDisableSendMessage.value = true;
          uni.showToast({
            title: '当前房间内\n您已被禁言',
            icon: 'none',
            duration: 2000,
            position: 'center',
          });
        }
        if (!obj.isMessageDisabled && oldUserInfo?.isMessageDisabled) {
          isDisableSendMessage.value = false;
          uni.showToast({
            title: '当前房间内\n您已被解除禁言',
            icon: 'none',
            duration: 2000,
            position: 'center',
          });
        }
      }
    });
  }, { immediate: true, deep: true });
</script>

<style>
  .input-wrapper {
    position: relative;
    background: rgba(15, 16, 20, 0.4);
    border-radius: 50%;
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 72rpx;
    padding-left: 16rpx;
    color: #ffffff;
    width: 260rpx;
    font-size: 28rpx;
    border: 1px solid rgba(255, 255, 255, 0.14);
  }
</style>