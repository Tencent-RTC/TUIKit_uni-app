<template>
  <view class="top-bar" :style="{ paddingTop: (safeAreaTop - 20) + 'px' }">
    <view class="top-bar-left">
      <FloatWindow />
    </view>
    <view class="top-bar-center">
      <CallTimer v-if="isConnected" />
      <text v-else-if="isGroupCalling" class="waiting-text">等待对方接收邀请</text>
    </view>
    <view class="top-bar-right" />
  </view>
</template>

<script>
  import FloatWindow from './Call/Controls/floatWindow.vue';
  import CallTimer from './CallTimer.vue';
  import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';

  var callStateInstance = useCallState();

  export default {
    components: {
      FloatWindow: FloatWindow,
      CallTimer: CallTimer
    },
    data: function() {
      return {
        safeAreaTop: 0
      };
    },
    computed: {
      selfInfo: function() {
        return callStateInstance.state.selfInfo;
      },
      activeCall: function() {
        return callStateInstance.state.activeCall;
      },
      isConnected: function() {
        var info = this.selfInfo;
        if (info && info.status === 2) {
          return true;
        }
        return false;
      },
      isGroupCalling: function() {
        var info = this.selfInfo;
        var call = this.activeCall;
        if (!info || info.status !== 1) {
          return false;
        }
        if (!call) {
          return false;
        }
        if (call.inviterId !== uni.$userID) {
          return false;
        }
        if (call.inviteeIds.length > 1 || call.chatGroupId !== '') {
          return true;
        }
        return false;
      }
    },
    mounted: function() {
      var self = this;
      uni.getSystemInfo({
        success: function(res) {
          var top = 0;
          if (res.safeArea && res.safeArea.top) {
            top = res.safeArea.top + 20;
          }
          self.safeAreaTop = top;
        }
      });
    }
  };
</script>

<style scoped>
  .top-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-left: 48rpx;
    padding-right: 24rpx;
    padding-bottom: 16rpx;
    min-height: 48px;
  }

  .top-bar-left {
    width: 96rpx;
    height: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .top-bar-center {
    flex: 1;
    height: 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .top-bar-right {
    width: 96rpx;
    height: 48px;
  }

  .waiting-text {
    font-size: 28rpx;
    color: #FFFFFF;
    font-weight: 400;
  }
</style>
