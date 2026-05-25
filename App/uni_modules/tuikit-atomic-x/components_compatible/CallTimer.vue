<template>
  <view v-if="isConnected" class="call-timer">
    <text class="timer-text">{{ formattedTime }}</text>
  </view>
</template>

<script>
  import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';

  var callStateInstance = useCallState();

  export default {
    data: function() {
      return {};
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
      formattedTime: function() {
        var call = this.activeCall;
        var duration = 0;
        if (call && call.duration) {
          duration = call.duration;
        }
        var hours = Math.floor(duration / 3600);
        var minutes = Math.floor((duration % 3600) / 60);
        var seconds = duration % 60;
        var hStr = hours < 10 ? '0' + hours : '' + hours;
        var mStr = minutes < 10 ? '0' + minutes : '' + minutes;
        var sStr = seconds < 10 ? '0' + seconds : '' + seconds;
        if (hours > 0) {
          return hStr + ':' + mStr + ':' + sStr;
        }
        return mStr + ':' + sStr;
      }
    }
  };
</script>

<style scoped>
  .call-timer {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timer-text {
    font-size: 28rpx;
    color: #FFFFFF;
    font-weight: 400;
  }
</style>
