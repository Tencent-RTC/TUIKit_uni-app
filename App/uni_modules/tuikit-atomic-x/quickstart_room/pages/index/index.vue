<template>
  <view class="page" :style="{ paddingTop: statusBarHeight + 'px' }">
    <text class="title">TUIRoomKit</text>

    <!-- 用户信息 -->
    <view class="card">
      <image class="avatar" :src="userInfo?.avatarURL || 'https://web.sdk.qcloud.com/component/TUIKit/assets/avatar_21.png'" />
      <view class="info">
        <text class="name">{{ userInfo?.nickname || '未登录' }}</text>
        <text class="id">{{ userInfo?.userID ? 'ID: ' + userInfo.userID : '请先登录' }}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="btn btn-primary" @tap="enterRoom">
      <text class="btn-text">进入房间</text>
    </view>
    <view class="btn btn-outline" @tap="handleLogout">
      <text class="btn-text-dark">退出登录</text>
    </view>

    <view class="footer">
      <text class="footer-text">Powered by Tencent Cloud RTC</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useLoginState } from '@/uni_modules/tuikit-atomic-x/state/LoginState'

const statusBarHeight = ref(0)
const { loginUserInfo: userInfo, logout } = useLoginState()

const enterRoom = () => {
  uni.navigateTo({ url: '/pages/scenes/room/index' })
}

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定退出登录？',
    success: (res) => {
      if (res.confirm) {
        logout({
          success: () => uni.reLaunch({ url: '/pages/login/login' }),
          fail: (_: number, msg: string) => uni.showToast({ title: msg || '退出失败', icon: 'none' })
        })
      }
    }
  })
}

onShow(() => {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 0
})
</script>

<style scoped>
page {
  background: #F5F5F5;
}
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 32rpx;
  background: #F5F5F5;
  box-sizing: border-box;
}
.title {
  font-size: 48rpx;
  font-weight: 600;
  color: #000;
  padding: 48rpx 0;
}
.card {
  display: flex;
  align-items: center;
  background: #FFF;
  padding: 32rpx;
  border-radius: 16rpx;
  margin-bottom: 32rpx;
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  background: #E5E5E5;
}
.info {
  display: flex;
  flex-direction: column;
}
.name {
  font-size: 32rpx;
  font-weight: 500;
  color: #000;
}
.id {
  font-size: 26rpx;
  color: #888;
  margin-top: 8rpx;
}
.btn {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 96rpx;
  border-radius: 12rpx;
  margin-bottom: 24rpx;
}
.btn-primary {
  background: #0468FC;
}
.btn-outline {
  background: #FFF;
  border: 1px solid #E5E5E5;
}
.btn-text {
  font-size: 32rpx;
  font-weight: 500;
  color: #FFF;
}
.btn-text-dark {
  font-size: 32rpx;
  font-weight: 500;
  color: #000;
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
  color: #AAA;
}
</style>
