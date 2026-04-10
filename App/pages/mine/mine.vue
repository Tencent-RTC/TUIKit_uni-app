<template>
  <view class="profile-page">
    <view class="profile-content">
      <view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
        <view class="navbar-content">
          <image class="navbar-back" src="/static/images/mine/back.png" mode="aspectFit" @click="goBack"></image>
          <text class="navbar-title">个人中心</text>
          <view></view>
        </view>
      </view>
      <view class="profile-info">
        <image class="profile-avatar" :src="userProfile.avatarURL || 'https://web.sdk.qcloud.com/component/TUIKit/assets/avatar_21.png'" mode="aspectFill"></image>
        <view class="profile-nickname">{{ userProfile.nickname || "未设置昵称" }}</view>
        <view class="profile-userid">ID:{{ userProfile.userID || "-" }}</view>
      </view>
      <view class="settings-list">
        <view v-for="item in settings" :key="item.id" class="settings-item" @click="navigateTo(item.route)">
          <image class="settings-icon" :src="item.icon" mode="aspectFit"></image>
          <text class="settings-label">{{ item.label }}</text>
          <image class="settings-arrow" src="/static/images/mine/right-arrow.png" mode="aspectFit"></image>
        </view>
        <!-- 导出日志入口 -->
        <view class="settings-item" @click="onExportLog">
          <image class="settings-icon" src="/static/images/mine/about.png" mode="aspectFit"></image>
          <text class="settings-label">导出日志</text>
          <image class="settings-arrow" src="/static/images/mine/right-arrow.png" mode="aspectFit"></image>
        </view>
      </view>
      <view class="logout-container">
        <text class="logout-btn" @tap="logout">
          退出登录
        </text>
      </view>
    </view>
    <!-- 日志文件列表弹窗 -->
    <view v-if="showLogDialog" class="log-dialog-mask" @click="closeLogDialog">
      <view class="log-dialog" @click.stop>
        <view class="log-dialog-header">
          <text class="log-dialog-title">日志文件列表</text>
          <text class="log-dialog-close" @click="closeLogDialog">✕</text>
        </view>
        <view v-if="logList.length === 0" class="log-empty">
          <text class="log-empty-text">暂无日志文件</text>
        </view>
        <scroll-view v-else scroll-y class="log-list-scroll">
          <view v-for="(item, index) in logList" :key="index" class="log-item" @click="onShareLogFile(index)">
            <text class="log-item-name">{{ item.fileName }}</text>
            <text class="log-item-share">分享</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>
<script>
  import {
    logoutKit,
  } from "@/server/loginService";
  import {
    useLoginState
  } from "@/uni_modules/tuikit-atomic-x/state/LoginState";
  import {
    fetchLogFileList,
    shareLog,
  } from "@/uni_modules/tuikit-atomic-x";
  const {
    loginUserInfo
  } = useLoginState();
  export default {
    data() {
      return {
        statusBarHeight: 0,
        showLogDialog: false,
        logList: [],
        settings: [{
            id: 'account',
            label: '账号与安全',
            icon: '/static/images/mine/setting.png',
            route: '/pages/account/account'
          },
          {
            id: 'privacy',
            label: '隐私设置',
            icon: '/static/images/mine/privacy.png',
            route: '/pages/privacy/privacy'
          },
          {
            id: 'about',
            label: '关于我们',
            icon: '/static/images/mine/about.png',
            route: '/pages/about/about'
          },
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
      onExportLog() {
        try {
          const jsonStr = fetchLogFileList();
          console.log('fetchLogFileList result:', jsonStr);
          this.logList = JSON.parse(jsonStr);
          this.showLogDialog = true;
          if (this.logList.length === 0) {
            uni.showToast({
              title: '暂无日志文件',
              icon: 'none'
            });
          }
        } catch (e) {
          console.error('解析日志列表失败:', e);
          this.logList = [];
          this.showLogDialog = true;
        }
      },
      onShareLogFile(index) {
        const item = this.logList[index];
        console.log('分享日志文件:', item?.fileName);
        shareLog(index);
      },
      closeLogDialog() {
        this.showLogDialog = false;
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

  /* 日志弹窗样式 */
  .log-dialog-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
  }

  .log-dialog {
    width: 620rpx;
    max-height: 800rpx;
    background: #ffffff;
    border-radius: 24rpx;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .log-dialog-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 36rpx;
    border-bottom: 1rpx solid #F0F0F0;
  }

  .log-dialog-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #000000;
  }

  .log-dialog-close {
    font-size: 36rpx;
    color: #999999;
    padding: 0 8rpx;
  }

  .log-empty {
    padding: 80rpx 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .log-empty-text {
    font-size: 28rpx;
    color: #999999;
  }

  .log-list-scroll {
    max-height: 680rpx;
  }

  .log-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 28rpx 36rpx;
    border-bottom: 1rpx solid #F5F5F5;
  }

  .log-item-name {
    flex: 1;
    font-size: 26rpx;
    color: #333333;
    lines: 1;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .log-item-share {
    font-size: 26rpx;
    color: #147AFF;
    padding-left: 16rpx;
  }
</style>