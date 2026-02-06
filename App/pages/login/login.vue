<template>
  <view class="login-page">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <view class="top-bar"></view>
    
    <view class="logo-section">
      <image class="logo-image" src="/static/images/logo.png" mode="aspectFit"></image>
    </view>
    
    <view class="form-container">
      <view class="login-form-section">
        <view v-if="loginUserInfo && loginUserInfo.userId" class="form-item">
          <text class="label-text">userID</text>
          <text class="value-text">{{ loginUserInfo.userId }}</text>
        </view>

        <view v-else class="login-form">
          <view class="form-item">
            <image class="form-icon" src="/static/images/login/phone.svg" mode="aspectFit"></image>
            <input 
              class="form-input" 
              type="text" 
              placeholder="请输入 userID" 
              placeholder-class="input-placeholder"
              v-model="userID"
            />
          </view>
          
          <!-- 协议勾选 -->
          <view class="agreement-row">
            <view class="checkbox" :class="{ checked: agreedProtocol }" @tap="toggleAgreement">
              <text v-if="agreedProtocol" class="check-icon">✓</text>
            </view>
            <view class="agreement-content">
              <view class="agreement-line">
                <text class="agreement-text">我已阅读并同意</text>
                <text class="link-text" @tap="viewPrivacy">《隐私协议摘要》</text>
                <text class="link-text" @tap="viewPrivacy">《隐私协议》</text>
              </view>
              <view class="agreement-line">
                <text class="agreement-text">和</text>
                <text class="link-text" @tap="viewUserAgreement">《用户协议》</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 登录按钮 -->
        <button class="login-btn" :class="{ active: canLogin, loading: isLogging }" @tap="handleLogin">
          <view v-if="isLogging" class="loading-icon"></view>
          <text class="login-btn-text">{{ isLogging ? '登录中...' : '登录' }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import { loginKit, loginUserInfo as userInfo } from "@/server/loginService";
import { EXTERNAL_URLS } from "@/server/constants";

export default {
  data() {
    return {
      statusBarHeight: 0,
      userID: '',
      agreedProtocol: false,
      isLogging: false,
    }
  },
  computed: {
    canLogin() {
      return this.userID.length > 0 && this.agreedProtocol
    },
    loginUserInfo() {
      return userInfo.value || {};
    }
  },
  onLoad() {
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight || 0;
  },
  methods: {
    toggleAgreement() {
      this.agreedProtocol = !this.agreedProtocol;
    },

    handleLogin() {
      if (!this.canLogin) {
        if (!this.agreedProtocol) {
          this.showToast('请先同意用户协议');
        } else if (!this.userID) {
          this.showToast('请输入 userID');
        }
        return
      }
      
      this.login();
    },

    login() {
      this.isLogging = true;
      loginKit({ userId: this.userID })
        .then(() => {
          this.isLogging = false;
        })
        .catch((err) => {
          this.isLogging = false;
          this.showToast(err.message || '登录失败');
        });
    },

    showToast(msg) {
      uni.showToast({
        title: msg,
        icon: 'none',
        duration: 1500,
      });
    },
    
    viewPrivacy() {
      uni.navigateTo({
        url: `/pages/webview/webview?url=${EXTERNAL_URLS.PRIVACY_GUIDELINES}`,
      });
    },
    
    viewUserAgreement() {
      uni.navigateTo({
        url: `/pages/webview/webview?url=${EXTERNAL_URLS.USER_AGREEMENT}`,
      });
    },
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.login-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 600rpx;
  background: url('../../static/images/login/login-bg.svg') no-repeat top center;
  background-size: 100%;
  pointer-events: none;
  z-index: -1;
}

.status-bar {
  width: 100%;
}

.top-bar {
  display: flex;
  justify-content: flex-end;
  padding: 32rpx 40rpx;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0 80rpx;
}

.logo-image {
  width: 426rpx;
  height: 96rpx;
}

.form-container {
  flex: 1;
  padding: 0 60rpx;
}

.login-form-section {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.login-form {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 28rpx;
  border: 2rpx solid #E4E8EE;
  border-radius: 16rpx;
  margin-bottom: 40rpx;
}

.form-icon {
  width: 40rpx;
  height: 40rpx;
}

.label-text {
  font-family: 'PingFang SC', sans-serif;
  font-size: 32rpx;
  color: #333333;
  padding: 0 16rpx;
}

.value-text {
  font-family: 'PingFang SC', sans-serif;
  font-size: 32rpx;
  color: #666666;
  flex: 1;
}

.form-input {
  flex: 1;
  font-family: 'PingFang SC', sans-serif;
  font-size: 32rpx;
  line-height: 48rpx;
  padding: 4rpx 16rpx;
}

.input-placeholder {
  color: #BBBBBB;
  font-size: 32rpx;
}

.agreement-row {
  display: flex;
  align-items: flex-start;
  margin: 20rpx 0 40rpx;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #CCCCCC;
  border-radius: 6rpx;
  margin-right: 12rpx;
  margin-top: 4rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.checkbox.checked {
  border-color: #1C66E5;
}

.check-icon {
  color: #1C66E5;
  font-size: 22rpx;
  font-weight: bold;
}

.agreement-content {
  display: flex;
  flex-direction: column;
}

.agreement-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.agreement-text {
  font-family: 'PingFang SC', sans-serif;
  font-size: 26rpx;
  color: #999999;
  line-height: 40rpx;
}

.link-text {
  font-family: 'PingFang SC', sans-serif;
  font-size: 26rpx;
  color: #1C66E5;
  line-height: 40rpx;
}

.login-btn {
  width: 100%;
  height: 96rpx;
  background: #1C66E5;
  border-radius: 48rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
}

.login-btn.active {
  opacity: 1;
}

.login-btn.loading {
  opacity: 0.7;
}

.login-btn-text {
  font-family: 'PingFang SC', sans-serif;
  font-weight: 500;
  font-size: 34rpx;
  color: #ffffff;
}

.loading-icon {
  width: 32rpx;
  height: 32rpx;
  border: 3rpx solid #ffffff;
  border-top: 3rpx solid transparent;
  border-radius: 50%;
  margin-right: 16rpx;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
