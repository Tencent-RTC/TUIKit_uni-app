<template>
  <view class="btn" @tap="handleBlur">
    <image class="btn-img" :style="[btnStyle]" :src="isBlur ? BLUR_ON_SRC : BLUR_OFF_SRC"></image>
    <text class="btn-text" v-if="isShowText">背景模糊</text>
  </view>
</template>

<script>
  import { useCallState } from '@/uni_modules/tuikit-atomic-x/state/CallState';

  var BLUR_ON_SRC = '/uni_modules/tuikit-atomic-x/static/icon/blur-on.png';
  var BLUR_OFF_SRC = '/uni_modules/tuikit-atomic-x/static/icon/blur-off.png';

  var callStateInstance = useCallState();

  export default {
    props: {
      size: {
        type: Number,
        default: 60
      },
      isShowText: {
        type: Boolean,
        default: true
      }
    },
    data: function() {
      return {
        isBlur: false,
        BLUR_ON_SRC: BLUR_ON_SRC,
        BLUR_OFF_SRC: BLUR_OFF_SRC
      };
    },
    computed: {
      btnStyle: function() {
        return {
          width: this.size + 'px',
          height: this.size + 'px'
        };
      }
    },
    methods: {
      handleBlur: function() {
        callStateInstance.enableVirtualBackground(!this.isBlur);
        this.isBlur = !this.isBlur;
      }
    }
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
