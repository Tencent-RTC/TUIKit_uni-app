<template>
  <view class="page" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="header">
      <text class="title">登录</text>
      <text class="subtitle">使用您的 SDK 凭证继续</text>
    </view>

    <!-- 表单 -->
    <view class="form">
      <text class="label">UserID</text>
      <input class="input" type="text" placeholder="请输入 UserID" v-model="userId" />

      <view class="btn" :class="{ 'btn--disabled': !canLogin }" @tap="handleLogin">
        <text class="btn-text">{{ isLoading ? '登录中...' : '登录' }}</text>
      </view>
    </view>

    <view class="footer">
      <text class="footer-text">TUIKit · 即时通讯解决方案</text>
    </view>
  </view>
</template>

<script>
import { useLoginState } from '@/uni_modules/tuikit-atomic-x/state/LoginState'
import { genTestUserSig } from '@/uni_modules/tuikit-atomic-x/debug/GenerateTestUserSig'

export default {
  data() {
    var loginState = useLoginState()
    return {
      statusBarHeight: 0,
      sdkAppId: 0,
      userId: '',
      secretKey: '',
      isLoading: false,
      loginState: loginState
    }
  },
  computed: {
    canLogin() {
      return this.sdkAppId !== 0 && this.userId.trim() && !this.isLoading
    }
  },
  onLoad() {
    this.statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0
  },
  methods: {
    handleLogin() {
      if (!this.canLogin) return
      this.isLoading = true

      this.loginState.login({
        sdkAppID: this.sdkAppId,
        userID: this.userId,
        userSig: genTestUserSig({
          SDKAppID: this.sdkAppId,
          userID: this.userId,
          secretKey: this.secretKey,
        }).userSig,
        success: () => {
          uni.reLaunch({ url: '/pages/scenes/chat/conversationList/conversationList' })
        },
        fail: (_, msg) => {
          this.isLoading = false
          uni.showToast({ title: msg || '登录失败', icon: 'none' })
        }
      })
    }
  }
}
</script>

<style scoped>
/* 设置页面根元素背景色 */
.page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 48rpx;
  background: #fff;
  box-sizing: border-box;
}
.header {
  padding: 96rpx 0 64rpx;
}
.title {
  display: block;
  font-size: 64rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 16rpx;
}
.subtitle {
  font-size: 28rpx;
  color: #86868B;
}
.form {
  display: flex;
  flex-direction: column;
}
.label {
  font-size: 28rpx;
  font-weight: 500;
  color: #1D1D1F;
  margin-bottom: 12rpx;
}
.input {
  height: 96rpx;
  padding: 0 24rpx;
  margin-bottom: 32rpx;
  font-size: 32rpx;
  background: #F9FAFC;
  border: 1px solid #E5E5EA;
  border-radius: 12rpx;
  box-sizing: border-box;
}
.input:focus {
  border-color: #007AFF;
  background: #FFF;
}
.btn {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 96rpx;
  margin-top: 16rpx;
  background: #007AFF;
  border-radius: 12rpx;
}
.btn:active {
  background: #0062CC;
}
.btn--disabled {
  background: #B4D7FF;
}
.btn-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #FFF;
}
.footer {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 64rpx;
}
.footer-text {
  font-size: 24rpx;
  color: #AEAEB2;
}
</style>
