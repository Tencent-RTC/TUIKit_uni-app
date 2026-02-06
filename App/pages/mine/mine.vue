<template>
  <view class="profile-page">
    <view class="profile-content">
      <view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
        <view class="navbar-content">
          <image class="navbar-back" src="/static/images/mine/back.png" mode="aspectFit" @click="goBack"></image>
          <text class="navbar-title">个人中心</text>
          <view></view>
          <!-- <image class="language-icon" src="/static/images/login/language.svg" mode="aspectFit"></image> -->
        </view>
      </view>
      <view class="profile-info">
        <image
          class="profile-avatar"
          :src="userProfile.avatar || 'https://web.sdk.qcloud.com/component/TUIKit/assets/avatar_21.png'"
          mode="aspectFill"
        ></image>
        <view class="profile-nickname">{{ userProfile.nickname || "未设置昵称" }}</view>
        <view class="profile-userid">ID:{{ userProfile.userId || "-" }}</view>
      </view>
      <view class="settings-list">
        <view 
          v-for="item in settings" 
          :key="item.id"
          class="settings-item" 
          @click="navigateTo(item.route)"
        >
          <image class="settings-icon" :src="item.icon" mode="aspectFit"></image>
          <text class="settings-label">{{ item.label }}</text>
          <image class="settings-arrow" src="/static/images/mine/right-arrow.png" mode="aspectFit"></image>
        </view>
      </view>
      <view class="logout-container">
        <text class="logout-btn" @tap="logout">
          退出登录
        </text>
      </view>
    </view>
  </view>
</template>
<script>
import { logoutKit, loginUserInfo } from "@/server/loginService";

export default {
  data() {
    return {
      statusBarHeight: 0,
      settings: [
        { id: 'account', label: '账号与安全', icon: '/static/images/mine/account.png', route: '/pages/account/account' },
        { id: 'privacy', label: '隐私设置', icon: '/static/images/mine/privacy.png', route: '/pages/privacy/privacy' },
        { id: 'about', label: '关于我们', icon: '/static/images/mine/about.png', route: '/pages/about/about' },
      ]
    }
  },
  computed: {
    userProfile() {
      return loginUserInfo.value || {};
    }
  },
  onLoad() {
    const systemInfo = uni.getSystemInfoSync()
    this.statusBarHeight = systemInfo.statusBarHeight || 0
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    navigateTo(url) {
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      })
    },
    async logout() {
      try {
        await logoutKit();
        uni.reLaunch({
          url: '/pages/login/login',
        })
      } catch (error) {
        console.error(error);
      }
    }
  }
}
</script>

<style lang="scss" scoped>

  
.profile-page {
  width: 100vw;
  min-height: 100vh;
  background: #EBEDF5;
}
.profile-content {
  width: 100vw;
  min-height: 100vh;
  background: url('../../static/images/mine/mine-bg.png') no-repeat top center;
  background-size: 100%;
}

.navbar-content {
  height: 88rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 36rpx;
}

.navbar-back {
  width: 36rpx;
  height: 36rpx;
}

.navbar-title {
  font-size: 36rpx;
  font-weight: 500;
  color: #000000;
}

.language-icon {
  width: 44rpx;
  height: 44rpx;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 96rpx 0 0;
}

.profile-avatar {
  width: 144rpx;
  height: 144rpx;
  border-radius: 72rpx;
  margin-bottom: 24rpx;
}

.profile-nickname {
  font-size: 36rpx;
  line-height: 52rpx;
  font-weight: 500;
  color: #000000;
  margin-bottom: 12rpx;
}

.profile-userid {
  font-size: 24rpx;
  line-height: 36rpx;
  font-size: 400;
  color: #626E84;
}

.settings-list {
  margin: 40rpx;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 8rpx 0;
}

.settings-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 16rpx 0;
  padding: 28rpx 40rpx;
}

.settings-icon {
  width: 48rpx;
  height: 48rpx;
}

.settings-label {
  flex: 1;
  font-size: 28rpx;
  line-height: 40rpx;
  font-size: 500;
  padding: 0 16rpx;
  color: #000000;
}

.settings-value {
  font-size: 28rpx;
  color: #999999;
  margin-right: 12rpx;
}

.settings-arrow {
  width: 32rpx;
  height: 32rpx;
}

.logout-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 40rpx;
}

.logout-btn {
  width: 100%;
  padding: 28rpx 0;
  background: #ffffff;
  color: #F33A50;
  border: none;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 500;
  text-align: center;
  line-height: 48rpx;
}
</style>