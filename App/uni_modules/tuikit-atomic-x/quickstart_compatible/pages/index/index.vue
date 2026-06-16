<template>
  <view class="page" :style="{ paddingTop: statusBarHeight + 'px' }">
    <text class="title">TUIKit</text>

    <!-- 用户信息 -->
    <view class="card">
      <image class="avatar" :src="userAvatarURL" />
      <view class="info">
        <text class="name">{{ userNickname }}</text>
        <text class="id">{{ userIDText }}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="btn btn-primary" @tap="startChat">
      <text class="btn-text">开始聊天</text>
    </view>
    <view class="btn btn-outline" @tap="handleLogout">
      <text class="btn-text-dark">退出登录</text>
    </view>

    <view class="footer">
      <text class="footer-text">Powered by Tencent Cloud IM</text>
    </view>
  </view>
</template>

<script>
  import {
    useLoginState
  } from '@/uni_modules/tuikit-atomic-x/state/LoginState'

  export default {
    data() {
      var loginState = useLoginState()
      return {
        statusBarHeight: 0,
        loginState: loginState
      }
    },
    computed: {
      userInfo() {
        return this.loginState.state.loginUserInfo
      },
      userAvatarURL() {
        return (this.userInfo && this.userInfo.avatarURL) || 'https://web.sdk.qcloud.com/component/TUIKit/assets/avatar_21.png'
      },
      userNickname() {
        return (this.userInfo && this.userInfo.nickname) || '未登录'
      },
      userIDText() {
        return (this.userInfo && this.userInfo.userID) ? 'ID: ' + this.userInfo.userID : '请先登录'
      }
    },
    onShow() {
      this.statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0
    },
    methods: {
      startChat() {
        uni.switchTab({
          url: '/pages/scenes/chat/conversationList/conversationList'
        })
      },
      handleLogout() {
        var self = this
        uni.showModal({
          title: '提示',
          content: '确定退出登录？',
          success: function(res) {
            if (res.confirm) {
              self.loginState.logout({
                success: function() {
                  uni.reLaunch({
                    url: '/pages/login/login'
                  })
                },
                fail: function(_, msg) {
                  uni.showToast({
                    title: msg || '退出失败',
                    icon: 'none'
                  })
                }
              })
            }
          }
        })
      }
    }
  }
</script>

<style scoped>
  /* 设置页面根元素背景色 */
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
    background: #007AFF;
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