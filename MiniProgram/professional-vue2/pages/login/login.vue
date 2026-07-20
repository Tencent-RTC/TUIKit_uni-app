<template>
  <view class="container">
    <view class="login-section">
      <text class="guide-text">请输入 userID 用于登录</text>
      <input class="input-box" v-model="userID" placeholder="请输入您的用户ID" placeholder-style="color:#BBBBBB;" />
      <button class="login-btn" @click="handleLogin">登录</button>
    </view>
  </view>
</template>

<script>
  import { TUILogin } from '@tencentcloud/tui-core-lite';
  import { TUIChatEngine } from '@tencentcloud/chat-uikit-engine-lite';
  import { genTestUserSig, SDKAPPID as SDKAppID } from '../../debug/GenerateTestUserSig-es.js';

  export default {
    data() {
      return {
        userID: '',
      };
    },
    methods: {
      // Set the CallView page path for CallKit auto-navigation.
      setCallPagePath() {
        wx.$globalCallPagePath = 'TUIKit/components/CallView/CallView';
      },
      async handleLogin() {
        if (!this.userID) {
          uni.showToast({
            title: '请输入用户ID',
            icon: 'none',
          });
          return;
        }

        try {
          const { userSig } = genTestUserSig({ userID: this.userID });

          await TUILogin.login({
            SDKAppID: SDKAppID,
            userID: this.userID,
            userSig,
            framework: 'vue3',
          });

          this.setCallPagePath();
          TUIChatEngine.isReady();

          uni.navigateTo({
            url: '/pages/index/index',
          });
        } catch (error) {
          console.error('Login failed:', error);
          uni.showToast({
            title: '登录失败',
            icon: 'none',
          });
        }
      },
    },
  };
</script>

<style scoped>
  .container {
    padding: 40px;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .login-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 100px;
  }

  .input-box {
    width: 80%;
    height: 50px;
    border: 1px solid #DDDDDD;
    border-radius: 8px;
    padding: 0 15px;
    margin-bottom: 20px;
    font-size: 16px;
  }

  .login-btn {
    width: 80%;
    height: 50px;
    background-color: #006EFF;
    color: white;
    border-radius: 8px;
    font-size: 16px;
    line-height: 50px;
  }

  .guide-text {
    font-weight: 600;
    font-size: 20px;
    color: rgb(47, 46, 46);
    margin-bottom: 40px;
  }
</style>
