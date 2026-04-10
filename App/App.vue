<script lang="ts">
  import { loginFromStorage } from './server/loginService';
  import { initCallService } from '@/uni_modules/tuikit-atomic-x/server/callService';
  let firstBackTime = 0
  export default {
    onLaunch: function () {
      console.log('App Launch')
      loginFromStorage();
      initCallService();
      uni?.removeStorage({
        key: 'showSecurity',
      });
    },
    onShow: function () {
      console.log('App Show')
    },
    onError: function (error: any) {
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const page = pages[pages.length - 1];
        console.error('[错误] 当前页面:', page.route, '页面实例:', page, error.name, error.message);
      }
    },
    onHide: function () {
      console.log('App Hide')
    },
    // #ifdef UNI-APP-X && APP-ANDROID
    onLastPageBackPress: function () {
      console.log('App LastPageBackPress')
      if (firstBackTime == 0) {
        uni.showToast({
          title: '再按一次退出应用',
          position: 'bottom',
        })
        firstBackTime = Date.now()
        setTimeout(() => {
          firstBackTime = 0
        }, 2000)
      } else if (Date.now() - firstBackTime < 2000) {
        firstBackTime = Date.now()
        uni.exit()
      }
    },
    // #endif
    onExit() {
      console.log('App Exit')
    },
  };
</script>

<style>
  uni-page-body,
  html,
  body,
  page {
    width: 100% !important;
    height: 100% !important;
    overflow: hidden;
  }
</style>